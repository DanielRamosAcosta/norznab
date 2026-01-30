import { describe, it, expect } from "vitest";
import { TVMaze } from "./TVMaze.ts";
import { getSpanishName } from "./schemas/aka.ts";

describe("TVMaze", () => {
  const tvmaze = TVMaze.create();

  it("gets a show by TVMaze ID", async () => {
    // Breaking Bad has TVMaze ID 169
    const results = await tvmaze.getShowById(169);

    expect(results).toBeDefined();
    expect(results.id).toBe(169);
    expect(results.name).toBe("Breaking Bad");
    expect(results.externals.thetvdb).toBe(81189);
  });

  it("looks up a show by TVDB ID", async () => {
    // Breaking Bad has TVDB ID 81189
    const results = await tvmaze.lookupByTvdbId(81189);

    expect(results).toBeDefined();
    expect(results.id).toBe(169);
    expect(results.name).toBe("Breaking Bad");
    expect(results.externals.thetvdb).toBe(81189);
  });

  it("looks up a show by IMDB ID", async () => {
    // Breaking Bad has IMDB ID tt0903747
    const results = await tvmaze.lookupByImdbId("tt0903747");

    expect(results).toBeDefined();
    expect(results.id).toBe(169);
    expect(results.name).toBe("Breaking Bad");
    expect(results.externals.imdb).toBe("tt0903747");
  });

  it("searches shows by name", async () => {
    const results = await tvmaze.searchShows("Breaking Bad");

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].show.name).toBe("Breaking Bad");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("gets alternative titles (AKAs) for a show", async () => {
    // Game of Thrones has many alternative titles
    const akas = await tvmaze.getShowAKAs(82);

    expect(akas).toBeDefined();
    expect(akas.length).toBeGreaterThan(0);

    // Should have Spanish title
    expect(getSpanishName(akas)).toBe("Juego de Tronos");
  });
});
