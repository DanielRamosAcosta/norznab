import { describe, it, expect, beforeEach } from "vitest";
import { DonTorrentTVAdapter } from "./DonTorrentTVAdapter.ts";
import { DonTorrentWrapper } from "./DonTorrentWrapper.ts";
import { DonTorrentScrapperLocalCache } from "./client/DonTorrentScrapperLocalCache.ts";
import { LoggerNoop } from "../../services/LoggerNoop.ts";
import { DonTorrentScrapper } from "./client/DonTorrentScrapper.ts";
import {
  SearchCriteriaEpisode,
  SearchCriteriaSeason,
} from "./Criterias.ts";

describe("DonTorrentTVAdapter", () => {
  let adapter: DonTorrentTVAdapter;

  beforeEach(async () => {
    adapter = new DonTorrentTVAdapter(
      new DonTorrentWrapper(
        new DonTorrentScrapperLocalCache(new DonTorrentScrapper()),
      ),
    );
  });

  it("finds a TV show episode", async () => {
    const criteria = new SearchCriteriaEpisode("Breaking Bad", 2, 1);
    const results = await adapter.findBy(criteria);

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
    const criteria = new SearchCriteriaEpisode("Breaking Bad", 8, 1);
    const results = await adapter.findBy(criteria);

    expect(results).toEqual([]);
  });

  it("returns empty array when no matching episode", async () => {
    const criteria = new SearchCriteriaEpisode("Breaking Bad", 2, 99);
    const results = await adapter.findBy(criteria);

    expect(results).toEqual([]);
  });

  it("finds TV show season pack", async () => {
    const criteria = new SearchCriteriaSeason("Breaking Bad", 1);
    const results = await adapter.findBy(criteria);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      type: "tv",
      category: 5000,
    });
    expect(results[0].title).toContain("Breaking Bad");
    expect(results[0].title).toContain("S01E01-S01E07");
    expect(results[0].link).toContain("magnet:");
    expect(results[0].size).toBeGreaterThan(0);
    expect(results[0].episode).toBeUndefined();
  });

  it("returns empty array when no matching season pack", async () => {
    const criteria = new SearchCriteriaSeason("Breaking Bad", 99);
    const results = await adapter.findBy(criteria);

    expect(results).toEqual([]);
  });
});
