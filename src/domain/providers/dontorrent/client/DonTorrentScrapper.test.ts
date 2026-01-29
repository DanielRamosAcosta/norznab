import { describe, it, expect, beforeEach } from "vitest";
import { DonTorrentScrapper } from "./DonTorrentScrapper.ts";
import { DonTorrentScrapperLocalCache } from "./DonTorrentScrapperLocalCache.ts";

describe("DonTorrentScrapper", () => {
  const donTorrent = new DonTorrentScrapperLocalCache(new DonTorrentScrapper());

  describe("search", () => {
    it("a specific movie", async () => {
      const results = await donTorrent.search("La Princesa Mononoke");

      expect(results).toEqual({
        items: [
          {
            name: "La Princesa Mononoke",
            path: "/pelicula/1964/La-Princesa-Mononoke",
            type: "Película",
          },
          {
            name: "La Princesa Mononoke",
            path: "/pelicula/17971/La-Princesa-Mononoke-",
            type: "Película",
          },
        ],
        meta: {
          page: 0,
          size: 2,
          totalItems: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });
    });

    it("shows pagination info with lots of results", async () => {
      const results = await donTorrent.search("the");

      expect(results).toEqual({
        items: expect.any(Array),
        meta: {
          page: 0,
          size: 30,
          totalItems: 3583,
          totalPages: 120,
          hasNext: true,
          hasPrevious: false,
        },
      });
    });

    it("shows the last page of a big search", async () => {
      const results = await donTorrent.search("the", 119);

      expect(results).toEqual({
        items: expect.any(Array),
        meta: {
          page: 119,
          size: 20,
          totalItems: 3583,
          totalPages: 120,
          hasNext: false,
          hasPrevious: true,
        },
      });
    });
  });

  it("getMovieMetadata", async () => {
    const path = "/pelicula/13047/Interstellar-FullBluRay";

    const metadata = await donTorrent.getMovieMetadata(path);

    expect(metadata).toEqual({
      contentId: 13047,
      table: "peliculas",
      title: "Interstellar (FullBluRay)",
      year: 2014,
      format: "BDremux-1080p",
    });
  });

  it("getMovieMetadata with DB", async () => {
    const path = "/pelicula/17842/Asesinato-en-el-Orient-Express";

    const metadata = await donTorrent.getMovieMetadata(path);

    expect(metadata.format).toEqual("BR-Screener");
  });

  it("getShowSeasonMetadata", async () => {
    const path = "/serie/2727/2728/Breaking-Bad-2-Temporada";

    const episodesMetadata = await donTorrent.getShowSeasonMetadata(path);

    expect(episodesMetadata).toEqual({
      format: "HDTV",
      episodes: [
        {
          contentId: 2728,
          table: "series",
          title: "2x01 - Siete Treinta y siete.",
          date: "2009-09-30",
        },
        {
          contentId: 2869,
          table: "series",
          title: "2x02 - A la parrilla.",
          date: "2009-10-10",
        },
        {
          contentId: 2870,
          table: "series",
          title: "2x03 -",
          date: "2009-10-10",
        },
        {
          contentId: 2989,
          table: "series",
          title: "2x04 -",
          date: "2009-10-23",
        },
        {
          contentId: 3028,
          table: "series",
          title: "2x05 -",
          date: "2009-10-27",
        },
        {
          contentId: 3111,
          table: "series",
          title: "2x06 -",
          date: "2009-11-04",
        },
        {
          contentId: 3137,
          table: "series",
          title: "2x07 - Negro y azul",
          date: "2009-11-09",
        },
        {
          contentId: 3364,
          table: "series",
          title: "2x08 - Debo llamar a Saul.",
          date: "2009-12-06",
        },
        {
          contentId: 3365,
          table: "series",
          title: "2x09 - 4 días fuera.",
          date: "2009-12-06",
        },
        {
          contentId: 3366,
          table: "series",
          title: "2x10 - Arriba.",
          date: "2009-12-06",
        },
        {
          contentId: 3414,
          table: "series",
          title: "2x11 -",
          date: "2009-12-10",
        },
        {
          contentId: 3496,
          table: "series",
          title: "2x12 - Phoenix.",
          date: "2009-12-21",
        },
        {
          contentId: 3604,
          table: "series",
          title: "2x13 -",
          date: "2010-01-03",
        },
      ],
    });
  });
});
