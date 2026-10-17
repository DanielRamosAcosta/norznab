import { describe, it, expect, vi } from "vitest";
import { DonTorrentWrapper } from "./DonTorrentWrapper.ts";
import type { DonTorrent } from "./client/DonTorrent.ts";
import { DonTorrentSearchResult } from "./client/models/DonTorrentSearchResult.ts";
import { DonTorrentMediaType } from "./client/models/DonTorrentMediaType.ts";

function page(hasNext: boolean, count = 1) {
  return {
    items: Array.from(
      { length: count },
      (_, i) =>
        new DonTorrentSearchResult(
          `/pelicula/${i}/x`,
          `x${i}`,
          DonTorrentMediaType.MOVIE,
        ),
    ),
    meta: { page: 0, size: count, hasNext },
  };
}

function scrapperReturning(
  search: DonTorrent["search"],
): DonTorrent {
  return { search } as DonTorrent;
}

describe("DonTorrentWrapper.searchAll", () => {
  it("throttles between pages and concatenates every page's items", async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce(page(true))
      .mockResolvedValueOnce(page(true))
      .mockResolvedValueOnce(page(false));
    const sleep = vi.fn(async () => {});

    const wrapper = new DonTorrentWrapper(scrapperReturning(search), sleep);
    const items = await wrapper.searchAll("the");

    expect(items).toHaveLength(3);
    expect(search).toHaveBeenCalledTimes(3);
    // one gap between each pair of pages, none after the last
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("stops at the depth cap even if the site keeps advertising more pages", async () => {
    const search = vi.fn(async () => page(true));
    const sleep = vi.fn(async () => {});

    const wrapper = new DonTorrentWrapper(scrapperReturning(search), sleep);
    await wrapper.searchAll("the");

    // MAX_PAGES caps the recursion at 20 requests.
    expect(search).toHaveBeenCalledTimes(20);
  });

  it("does not throttle when the first page is the last", async () => {
    const search = vi.fn(async () => page(false));
    const sleep = vi.fn(async () => {});

    const wrapper = new DonTorrentWrapper(scrapperReturning(search), sleep);
    await wrapper.searchAll("the");

    expect(search).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});
