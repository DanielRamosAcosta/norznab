import { describe, it, expect, vi, afterEach } from "vitest";
import { EnlacitoResolver } from "./EnlacitoResolver.ts";

const PASSPHRASE = "fee631d2cffda38a78b96ee6d2dfb43a";
// Real link_out payload -> its decrypted signed URL (see decodeLink.spec).
const LINK_OUT =
  "VTJGc2RHVmtYMSs2WUxBUG94dit2VjVJT1l2T2ROQnNEeHZLbUJCRndQTzh2NkNYU3YrNHA1WVhUNVg2MFM0UDlYY1ZQamp6T2g1eDVVdDFBT2ZhYytycDVFSE9uVlhSUnVPaGJZTEtmK1NHU09WQXFKQStSMWdJL2FERXpqd25VaVBhaExzWTA4N3N0US92UHUzeVAzZklaS0pzVWp4cjZoQnBvL1Z3dzd1TG9ia2w4RG1adlFJVjJWQ1R4dEttK2NjSEJsbVBPVFZuMDdLM3RCVGdDdz09";
const EXPECTED =
  "https://wolfmax4k.com/assets/u/t/temp/16082025/250811/superman--2025---BLuRayRip_17_1225.torrent?md5=axfiOt8sij5cVSreAm0Uxw&expires=1786884525";

afterEach(() => vi.unstubAllGlobals());

describe("EnlacitoResolver", () => {
  it("resolves the signed torrent URL from link_out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/s.php")) {
          return new Response("", {
            headers: { "set-cookie": "PHPSESSID=abc; path=/" },
          });
        }
        return new Response(`before var link_out = "${LINK_OUT}" after`);
      }),
    );

    const resolver = new EnlacitoResolver("https://enlacito.com", PASSPHRASE);

    await expect(
      resolver.resolve("https://enlacito.com/s.php?i=token"),
    ).resolves.toBe(EXPECTED);
  });

  it("rejects instead of hanging when enlacito stalls past the timeout", async () => {
    // A fetch that never responds but honours the abort signal (like undici).
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener("abort", () =>
              reject(opts.signal.reason ?? new Error("aborted")),
            );
          }),
      ),
    );

    const resolver = new EnlacitoResolver(
      "https://enlacito.com",
      PASSPHRASE,
      undefined,
      25,
    );

    await expect(
      resolver.resolve("https://enlacito.com/s.php?i=token"),
    ).rejects.toThrow();
  });
});
