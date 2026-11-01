import * as cheerio from "cheerio";
import { ProxyAgent, request, type Dispatcher } from "undici";
import type { Logger } from "../../../services/Logger.ts";
import { LoggerNoop } from "../../../services/LoggerNoop.ts";

const DEFAULT_PROFILE_URL = "https://privtr.ee/@DonTorrent";
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2h
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

export interface DonTorrentDomainResolverOptions {
  /** Tor HTTP proxy URL (e.g. the cluster tor-proxy). Used unless `dispatcher` is given. */
  torProxyUrl?: string;
  /** undici dispatcher override, mainly for tests (MockAgent). */
  dispatcher?: Dispatcher;
  logger?: Logger;
  profileUrl?: string;
  ttlMs?: number;
  timeoutMs?: number;
  now?: () => number;
}

/**
 * Resolves DonTorrent's current domain from the verified linktree at
 * privtr.ee/@DonTorrent, which always links to the live domain. More
 * deterministic than seeding a fixed URL and following its 301s.
 *
 * Flow (over Tor — privtr.ee is SNI-blocked by the ISP like DonTorrent):
 *   1. GET the profile, parse the "Dominio Actual" anchor → /going/<id>.
 *   2. GET /going/<id> with the profile as Referer and no redirect following;
 *      the Location header holds the current domain. Without the Referer the
 *      redirector bounces back to the profile.
 * Uses undici's low-level `request` (fetch forbids the Referer header and
 * strips Location on manual redirects). The result is cached with a TTL (2h).
 */
export class DonTorrentDomainResolver {
  private readonly dispatcher: Dispatcher;
  private readonly logger: Logger;
  private readonly profileUrl: string;
  private readonly ttlMs: number;
  private readonly timeoutMs: number;
  private readonly now: () => number;
  private cached?: { domain: string; expiresAt: number };

  constructor(options: DonTorrentDomainResolverOptions = {}) {
    const dispatcher =
      options.dispatcher ??
      (options.torProxyUrl ? new ProxyAgent(options.torProxyUrl) : undefined);
    if (!dispatcher) {
      throw new Error(
        "DonTorrentDomainResolver requires torProxyUrl or dispatcher",
      );
    }
    this.dispatcher = dispatcher;
    this.logger = (options.logger ?? new LoggerNoop()).forClass(
      DonTorrentDomainResolver.name,
    );
    this.profileUrl = options.profileUrl ?? DEFAULT_PROFILE_URL;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.timeoutMs = options.timeoutMs ?? 40_000;
    this.now = options.now ?? (() => Date.now());
  }

  async resolve(): Promise<string> {
    if (this.cached && this.cached.expiresAt > this.now()) {
      return this.cached.domain;
    }

    const domain = await this.fetchDomain();
    this.cached = { domain, expiresAt: this.now() + this.ttlMs };
    this.logger.info("Resolved DonTorrent domain", { domain });
    return domain;
  }

  private async fetchDomain(): Promise<string> {
    const goingUrl = await this.findGoingUrl();

    // undici.request does not follow redirects by default — exactly what we
    // want: read the 302's Location without loading DonTorrent.
    const response = await request(goingUrl, {
      dispatcher: this.dispatcher,
      method: "GET",
      headers: { "user-agent": USER_AGENT, referer: this.profileUrl },
      headersTimeout: this.timeoutMs,
      bodyTimeout: this.timeoutMs,
    });
    response.body.dump();

    const location = response.headers["location"];
    const target = Array.isArray(location) ? location[0] : location;
    if (!target) {
      throw new Error(
        `privtr.ee /going did not redirect (status ${response.statusCode})`,
      );
    }

    const origin = new URL(target).origin;
    if (origin === new URL(this.profileUrl).origin) {
      throw new Error(
        "privtr.ee /going bounced back to the profile (missing Referer?)",
      );
    }
    return origin;
  }

  private async findGoingUrl(): Promise<string> {
    const response = await request(this.profileUrl, {
      dispatcher: this.dispatcher,
      method: "GET",
      headers: { "user-agent": USER_AGENT, accept: "text/html" },
      headersTimeout: this.timeoutMs,
      bodyTimeout: this.timeoutMs,
    });
    const html = await response.body.text();
    const $ = cheerio.load(html);

    const href = $("a")
      .filter((_, el) => {
        const label = $(el).attr("aria-label") ?? "";
        const text = $(el).text();
        return /dominio actual/i.test(label) || /dominio actual/i.test(text);
      })
      .first()
      .attr("href");

    if (!href) {
      throw new Error("privtr.ee: 'Dominio Actual' link not found");
    }

    return new URL(href, this.profileUrl).href;
  }
}
