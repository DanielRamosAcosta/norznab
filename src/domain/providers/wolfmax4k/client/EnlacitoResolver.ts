import { decodeLink } from "./decodeLink.ts";

/**
 * Resolves a wolfmax4k download link (an `enlacito.com/s.php?i=<token>` URL)
 * into the real, signed `.torrent` URL, without going through the ad-gate.
 *
 * How enlacito works:
 *  1. `GET s.php?i=<token>` (Referer: wolfmax4k) decrypts the token server-side
 *     and stashes the destination in the PHP session (sets a `PHPSESSID` cookie).
 *  2. `POST /` with that session renders the page with `var link_out`, a
 *     GibberishAES payload of the destination encrypted with a static key.
 *  3. Decrypting `link_out` yields the signed torrent URL hosted on wolfmax4k.
 *
 * enlacito is reachable over plain HTTPS (it is not part of the ISP block), so
 * this step uses the standard fetch stack.
 */
export class EnlacitoResolver {
  private readonly baseUrl: string;
  private readonly passphrase: string;
  private readonly userAgent: string;
  private readonly timeout: number;

  // ROT13("wolfmax4k.com") — the constant fallback the s.php form posts back.
  private static readonly LINKSER_FALLBACK = "jbysznk4x.pbz";

  constructor(
    baseUrl = "https://enlacito.com",
    passphrase = "fee631d2cffda38a78b96ee6d2dfb43a",
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // Per-request budget. enlacito normally answers in <2s; a short cap keeps a
    // throttled/stalled connection from hanging the whole search (undici's fetch
    // has no default timeout), letting that edition fail fast and be dropped.
    timeout = 20_000,
  ) {
    this.baseUrl = baseUrl;
    this.passphrase = passphrase;
    this.userAgent = userAgent;
    this.timeout = timeout;
  }

  async resolve(sharerUrl: string): Promise<string> {
    const token = new URL(sharerUrl).searchParams.get("i");
    if (!token) {
      throw new Error(`No enlacito token in: ${sharerUrl}`);
    }

    const sUrl = `${this.baseUrl}/s.php?i=${encodeURIComponent(token)}`;

    const sResponse = await fetch(sUrl, {
      headers: {
        "user-agent": this.userAgent,
        referer: "https://wolfmax4k.com/",
      },
      signal: AbortSignal.timeout(this.timeout),
    });
    const cookie = (sResponse.headers.getSetCookie?.() ?? [])
      .map((entry) => entry.split(";")[0])
      .join("; ");

    const pageResponse = await fetch(`${this.baseUrl}/`, {
      method: "POST",
      headers: {
        "user-agent": this.userAgent,
        referer: sUrl,
        "content-type": "application/x-www-form-urlencoded",
        cookie,
      },
      body: `linkser=${EnlacitoResolver.LINKSER_FALLBACK}`,
      signal: AbortSignal.timeout(this.timeout),
    });
    const html = await pageResponse.text();

    const linkOut = html.match(/var link_out = "([A-Za-z0-9+/=]+)"/)?.[1];
    if (!linkOut) {
      throw new Error("Could not find link_out in enlacito response");
    }

    return decodeLink(linkOut, this.passphrase);
  }
}
