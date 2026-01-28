import { describe, it, expect } from "vitest";
import { TMDB } from "./TMDB.ts";
import { config } from "../../../infrastructure/config.ts";

describe("TMDB", () => {
  const apiKey = config.TMDB_API_KEY;

  it("finds a tv show by id", async () => {
    const tmdb = new TMDB({ apiKey });
    const breakingBadId = 1396;

    const results = await tmdb.getTvShow(breakingBadId);

    expect(results).toBeDefined();
    expect(results.id).toEqual(breakingBadId);
    expect(results.name).toBe("Breaking Bad");
    expect(results.overview).toContain("química con cáncer");
  });

  it("finds a movie by id (Interstellar)", async () => {
    const tmdb = new TMDB({ apiKey });
    const interstellarId = 157336;

    const results = await tmdb.getMovie(interstellarId);

    expect(results).toBeDefined();
    expect(results.id).toEqual(interstellarId);
    expect(results.title).toBe("Interstellar");
    expect(results.original_title).toBe("Interstellar");
  });
});
