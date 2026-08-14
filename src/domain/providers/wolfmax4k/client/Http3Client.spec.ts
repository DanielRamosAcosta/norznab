import { describe, it, expect, vi, beforeEach } from "vitest";

const destroy = vi.fn();
// A fake quico whose request never invokes the response callback, so every
// attempt hits the client's timeout — exercising the retry + recycle path.
vi.mock("quico", () => ({
  default: {
    request: () => ({
      on: () => {},
      write: () => {},
      end: () => {},
      abort: () => {},
    }),
    globalAgent: { destroy },
  },
}));

const { QuicoHttp3Client } = await import("./Http3Client.ts");

describe("QuicoHttp3Client stale-connection recovery", () => {
  beforeEach(() => destroy.mockClear());

  it("recycles the QUIC pool when a request times out, then rejects after retries", async () => {
    // Tiny timeout so the (never-answered) request times out immediately.
    const client = new QuicoHttp3Client(15, undefined, 2);

    await expect(
      client.send({ hostname: "wolfmax4k.com", path: "/" }),
    ).rejects.toThrow(/timed out/);

    // On a timeout it tears down quico's global agent so the retry reconnects.
    expect(destroy).toHaveBeenCalled();
  });
});
