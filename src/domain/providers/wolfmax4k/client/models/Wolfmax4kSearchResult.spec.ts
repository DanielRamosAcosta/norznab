import { describe, it, expect } from "vitest";
import { Wolfmax4kSearchResult } from "./Wolfmax4kSearchResult.ts";

function result(guid: string, name: string, quality = "HDTV") {
  return new Wolfmax4kSearchResult(guid, quality, name, "");
}

describe("Wolfmax4kSearchResult", () => {
  it("builds the detail path from the guid", () => {
    expect(result("movie/250811", "Superman (2025)").detailPath).toBe(
      "/movie/250811",
    );
  });

  describe("episode marker parsing ([Cap.SEE])", () => {
    it.each([
      ["Superman and Lois [HDTV 1080p][Cap.309]", 3, 9],
      ["Superman and Lois [HDTV][Cap.407]", 4, 7],
      ["Mis Aventuras Con Superman [HDTV 1080p][Cap.101]", 1, 1],
      ["Serie diaria [HDTV][Cap.1203]", 12, 3],
      ["Con sufijo [HDTV][Cap.313](wolfmax4k.com)", 3, 13],
      ["Minúsculas [HDTV][cap.404]", 4, 4],
    ])("parses %s -> S%iE%i", (name, season, episode) => {
      const marker = result("online/1", name).episodeMarker;
      expect(marker).toEqual({ season, episode });
    });

    it("returns null for movies", () => {
      expect(result("movie/1", "Superman (2025) [Bluray]").episodeMarker).toBe(
        null,
      );
    });

    it("tolerates the source's backtick typo", () => {
      const r = result("online/1", "Rick y Morty [HDTV 1080p]`Cap.802]");
      expect(r.episodeMarker).toEqual({ season: 8, episode: 2 });
      expect(r.isTVEpisode()).toBe(true);
    });
  });

  describe("season packs ([Cap.SEE_SEE])", () => {
    it("parses a full-season pack range", () => {
      const r = result(
        "serie-online/1",
        "Rick Y Morty - Temporada 5 [HDTV][Cap.501_512]",
      );
      expect(r.seasonPack).toEqual({ season: 5, from: 1, to: 12 });
      expect(r.episodeMarker).toBe(null);
    });

    it("parses a partial pack range", () => {
      const r = result("serie-online/1", "Temporada 4 [HDTV][Cap.406_408]");
      expect(r.seasonPack).toEqual({ season: 4, from: 6, to: 8 });
    });

    it("is TV and matches the season, but not a single episode", () => {
      const r = result("serie-online/1", "Temporada 5 [HDTV][Cap.501_512]");
      expect(r.isTVEpisode()).toBe(true);
      expect(r.isMovie()).toBe(false);
      expect(r.matchesSeason(5)).toBe(true);
      expect(r.matchesSeason(4)).toBe(false);
      expect(r.matchesEpisode(5, 3)).toBe(false);
    });
  });

  it("classifies episodes vs movies from the name, not the guid prefix", () => {
    // Movies also appear under the `online/` prefix.
    const movie = result("online/250810", "Superman (2025) [Bluray 720p][Esp]");
    const episode = result(
      "online/269020",
      "Mis aventuras con Superman [Cap.309]",
    );

    expect(movie.isMovie()).toBe(true);
    expect(movie.isTVEpisode()).toBe(false);
    expect(episode.isTVEpisode()).toBe(true);
    expect(episode.isMovie()).toBe(false);
  });

  it("parses the release year", () => {
    expect(result("movie/1", "Superman (2025) [Bluray]").year).toBe(2025);
    expect(result("online/1", "Serie [Cap.101]").year).toBe(null);
  });

  it("matches by season and by episode", () => {
    const r = result("serie-online/1", "Show [HDTV][Cap.407]");
    expect(r.matchesSeason(4)).toBe(true);
    expect(r.matchesSeason(3)).toBe(false);
    expect(r.matchesEpisode(4, 7)).toBe(true);
    expect(r.matchesEpisode(4, 8)).toBe(false);
  });
});
