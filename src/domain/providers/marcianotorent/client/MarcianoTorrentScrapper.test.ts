import { describe, it, expect } from "vitest";
import { MarcianoTorrentScrapper } from "./MarcianoTorrentScrapper.ts";
import { MarcianoTorrentScrapperLocalCache } from "./MarcianoTorrentScrapperLocalCache.ts";

describe("MarcianoTorrentScrapper", () => {
  const scrapper = new MarcianoTorrentScrapperLocalCache(
    new MarcianoTorrentScrapper("https://marcianotorrent.net"),
  );

  describe("search", () => {
    it("finds a specific movie", async () => {
      const results = await scrapper.search("A Silent Voice");

      expect(results.meta).toEqual({
        page: 0,
        size: 1,
        hasNext: false,
      });

      expect(results.items).toHaveLength(1);
      expect(results.items[0]).toMatchObject({
        title: "A Silent Voice",
        quality: "HDRip",
        href: "https://marcianotorrent.net/peliculas/peli-descargar-torrent-20240-a-silent-voice",
      });
    });
  });

  it("getMovieMetadata", async () => {
    const path = "/peliculas/peli-descargar-torrent-20240-a-silent-voice";

    const metadata = await scrapper.getMovieMetadata(path);

    expect(metadata).toEqual({
      title: "A Silent Voice.",
      year: 2016,
      format: "HDRip",
      torrentPath: "/torrents/peliculas/A_Silent_Voice_BluRay_Rip.torrent",
    });
  });

  it("download", async () => {
    const buffer = await scrapper.download(
      "/torrents/peliculas/A_Silent_Voice_BluRay_Rip.torrent",
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
