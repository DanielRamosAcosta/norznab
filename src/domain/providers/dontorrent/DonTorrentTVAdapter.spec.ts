import { describe, it, expect, beforeEach } from "vitest";
import { DonTorrentTVAdapter } from "./DonTorrentTVAdapter.ts";
import { DonTorrentWrapper } from "./DonTorrentWrapper.ts";
import { DonTorrentScrapperLocalCache } from "./client/DonTorrentScrapperLocalCache.ts";
import { DonTorrentUnimplemented } from "./client/DonTorrentUnimplemented.ts";

describe("DonTorrentTVAdapter", () => {
  let adapter: DonTorrentTVAdapter;

  beforeEach(async () => {
    adapter = new DonTorrentTVAdapter(
      new DonTorrentWrapper(
        new DonTorrentScrapperLocalCache(new DonTorrentUnimplemented()),
      ),
    );
  });

  it("finds a TV show episode", async () => {
    const results = await adapter.findTVShowEpisode(
      "Breaking Bad",
      2,
      1,
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      type: "tv",
      title: "Breaking Bad S02E01 HDTV",
      season: 2,
      episode: 1,
      category: 5000,
    });
    expect(results[0].link).toContain("magnet:");
    expect(results[0].size).toBeGreaterThan(0);
  });

  it("returns empty array when no matching season", async () => {
    const results = await adapter.findTVShowEpisode(
      "Breaking Bad",
      8,
      1,
    );

    expect(results).toEqual([]);
  });

  it("returns empty array when no matching episode", async () => {
    const results = await adapter.findTVShowEpisode(
      "Breaking Bad",
      2,
      99,
    );

    expect(results).toEqual([]);
  });
});
