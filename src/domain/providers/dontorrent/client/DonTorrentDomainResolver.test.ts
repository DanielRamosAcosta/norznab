import { describe, it, expect } from "vitest";
import { DonTorrentDomainResolver } from "./DonTorrentDomainResolver.ts";

// privtr.ee is SNI-blocked by the ISP, so the resolver must go through Tor.
// Point this at the cluster tor-proxy (e.g. `kubectl port-forward svc/tor-proxy 8118:8118`).
const TOR_PROXY = process.env.DON_TORRENT_TOR_PROXY ?? "http://localhost:8118";

describe("DonTorrentDomainResolver (integration, via Tor)", () => {
  it("resolves the current DonTorrent domain from privtr.ee", async () => {
    const resolver = new DonTorrentDomainResolver({ torProxyUrl: TOR_PROXY });

    const domain = await resolver.resolve();

    expect(domain).toMatch(/^https:\/\/dontorrent\./);
  }, 60_000);
});
