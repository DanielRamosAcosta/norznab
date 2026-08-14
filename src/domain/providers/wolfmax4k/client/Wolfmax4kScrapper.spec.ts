import { describe, it, expect, vi } from "vitest";
import { Wolfmax4kScrapper } from "./Wolfmax4kScrapper.ts";
import type { Http3Client, Http3Response } from "../../http3/Http3Client.ts";

function response(body: string): Http3Response {
  return {
    status: 200,
    httpVersion: "3.0",
    headers: {},
    body: Buffer.from(body, "utf8"),
  };
}

const HOME_HTML = `<input type="hidden" name="token" value="abc123deadbeef"/>`;

function findJson(pgcount: number, items: Record<string, unknown>[]): string {
  const datafinds = Object.fromEntries(
    items.map((item, i) => [String(i), item]),
  );
  return JSON.stringify({
    response: true,
    data: {
      pgcount,
      pg: "1 : 0,100",
      message: "Find",
      cidr: "",
      c: "",
      results: items.length,
      datafinds: { "0": datafinds },
    },
  });
}

const ITEM = {
  guid: "movie/250811",
  calidad: "BluRay 1080p",
  torrentName: "Superman (2025) [Bluray 1080p][Esp]",
  pic: null,
  picc: null,
  image: "https://wolfmax4k.com/x.jpg",
};

function fakeHttp(findBody: string): Http3Client {
  return {
    send: vi.fn(async (options) => {
      if (options.path === "/") return response(HOME_HTML);
      if (options.path === "/mvc/controllers/data.find.php")
        return response(findBody);
      throw new Error(`unexpected path ${options.path}`);
    }),
  };
}

describe("Wolfmax4kScrapper.search", () => {
  it("parses the datafinds group into search results", async () => {
    const scrapper = new Wolfmax4kScrapper(
      "https://wolfmax4k.com",
      1000,
      fakeHttp(findJson(1, [ITEM])),
    );

    const { items } = await scrapper.search("Superman");

    expect(items).toHaveLength(1);
    expect(items[0].guid).toBe("movie/250811");
    expect(items[0].quality).toBe("BluRay 1080p");
    expect(items[0].torrentName).toBe("Superman (2025) [Bluray 1080p][Esp]");
    expect(items[0].isMovie()).toBe(true);
  });

  it("flags hasNext when pgcount exceeds one page", async () => {
    const scrapper = new Wolfmax4kScrapper(
      "https://wolfmax4k.com",
      1000,
      fakeHttp(findJson(240, [ITEM])),
    );

    const { meta } = await scrapper.search("Superman", 0);
    expect(meta.hasNext).toBe(true);

    const { meta: lastPage } = await scrapper.search("Superman", 2);
    expect(lastPage.hasNext).toBe(false);
  });

  it("returns an empty page for a query with no results", async () => {
    const scrapper = new Wolfmax4kScrapper(
      "https://wolfmax4k.com",
      1000,
      fakeHttp(findJson(0, [])),
    );

    const { items, meta } = await scrapper.search("zzznope");
    expect(items).toHaveLength(0);
    expect(meta.hasNext).toBe(false);
  });
});
