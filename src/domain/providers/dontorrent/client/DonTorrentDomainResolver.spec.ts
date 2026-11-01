import { describe, it, expect } from "vitest";
import { MockAgent } from "undici";
import { DonTorrentDomainResolver } from "./DonTorrentDomainResolver.ts";

const PROFILE_HTML = `
  <html><body>
    <a href="/es/">Volver al inicio</a>
    <a aria-label="Dominio Actual · Se abre en otra pestaña" href="/going/999">Dominio Actual</a>
    <a href="/going/111">Proxy de DonTorrent</a>
  </body></html>`;

function mockPrivtree(times: number): MockAgent {
  const agent = new MockAgent();
  agent.disableNetConnect();
  const pool = agent.get("https://privtr.ee");
  pool
    .intercept({ path: "/@DonTorrent", method: "GET" })
    .reply(200, PROFILE_HTML)
    .times(times);
  pool
    .intercept({ path: "/going/999", method: "GET" })
    .reply(302, "", { headers: { location: "https://dontorrent.example/" } })
    .times(times);
  return agent;
}

describe("DonTorrentDomainResolver", () => {
  it("parses the 'Dominio Actual' link and follows /going to the domain", async () => {
    const agent = mockPrivtree(1);
    const resolver = new DonTorrentDomainResolver({ dispatcher: agent });

    expect(await resolver.resolve()).toBe("https://dontorrent.example");
  });

  it("serves the cache within the TTL and refetches after it expires", async () => {
    const agent = mockPrivtree(2); // exactly two rounds allowed
    let clock = 1_000;
    const resolver = new DonTorrentDomainResolver({
      dispatcher: agent,
      ttlMs: 100,
      now: () => clock,
    });

    expect(await resolver.resolve()).toBe("https://dontorrent.example"); // round 1
    clock += 50; // still within TTL
    expect(await resolver.resolve()).toBe("https://dontorrent.example"); // cached, no request
    clock += 100; // past TTL
    expect(await resolver.resolve()).toBe("https://dontorrent.example"); // round 2

    // Exactly two rounds consumed → the middle call was served from cache.
    agent.assertNoPendingInterceptors();
  });

  it("throws when the 'Dominio Actual' link is absent", async () => {
    const agent = new MockAgent();
    agent.disableNetConnect();
    agent
      .get("https://privtr.ee")
      .intercept({ path: "/@DonTorrent", method: "GET" })
      .reply(200, "<html><body>no links here</body></html>");
    const resolver = new DonTorrentDomainResolver({ dispatcher: agent });

    await expect(resolver.resolve()).rejects.toThrow(/Dominio Actual/);
  });
});
