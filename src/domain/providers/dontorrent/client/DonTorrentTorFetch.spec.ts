import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const destroy = vi.fn();
let proxyAgentCount = 0;

vi.mock("undici", () => ({
  ProxyAgent: class {
    constructor() {
      proxyAgentCount++;
    }
    destroy = destroy;
  },
}));

const { createTorFetch } = await import("./DonTorrentTorFetch.ts");

function response(status: number, headers: Record<string, string> = {}) {
  return new Response(status === 429 ? "rate limited" : "ok", {
    status,
    headers,
  });
}

describe("createTorFetch (429 retry + circuit recycling)", () => {
  const sleep = vi.fn(async () => {});

  beforeEach(() => {
    destroy.mockClear();
    sleep.mockClear();
    proxyAgentCount = 0;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("recycles the circuit and retries on a 429, then returns the 200", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(429))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const torFetch = createTorFetch("http://tor:8118", 30_000, { sleep });
    const result = await torFetch("https://dontorrent.channel/buscar");

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // one for the initial dispatcher + one recycle
    expect(proxyAgentCount).toBe(2);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("honours Retry-After when deciding the backoff", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(429, { "retry-after": "5" }))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const torFetch = createTorFetch("http://tor:8118", 30_000, { sleep });
    await torFetch("https://dontorrent.channel/buscar");

    expect(sleep).toHaveBeenCalledWith(5_000);
  });

  it("recycles and retries on a socket error, then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("UND_ERR_SOCKET"))
      .mockResolvedValueOnce(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const torFetch = createTorFetch("http://tor:8118", 30_000, { sleep });
    const result = await torFetch("https://dontorrent.channel/buscar");

    expect(result.status).toBe(200);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("returns the last 429 once retries are exhausted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(429));
    vi.stubGlobal("fetch", fetchMock);

    const torFetch = createTorFetch("http://tor:8118", 30_000, {
      sleep,
      retries: 2,
    });
    const result = await torFetch("https://dontorrent.channel/buscar");

    expect(result.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(destroy).toHaveBeenCalledTimes(2); // recycled between retries only
  });

  it("does not retry a plain 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(200));
    vi.stubGlobal("fetch", fetchMock);

    const torFetch = createTorFetch("http://tor:8118", 30_000, { sleep });
    await torFetch("https://dontorrent.channel/buscar");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });
});
