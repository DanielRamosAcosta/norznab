import { describe, it, expect } from "vitest";
import { testClient } from "hono/testing";
import { app } from "./app.ts";

describe("tvsearch", () => {
  it("returns mock data for generic search (for indexer test)", async () => {
    const client = testClient(app);

    const response = await client.api.$get({
      query: {
        t: "tvsearch",
        cat: "5000,5040",
        offset: "0",
        limit: "100",
        extended: "0",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.text();
    expect(data).toContain("<?xml");
    expect(data).toContain("<rss");
    expect(data).toContain("<channel>");
    expect(data).toContain("<item>");
  });

  it("searches tv show by tmdbid", async () => {
    const client = testClient(app);

    const response = await client.api.$get({
      query: {
        t: "tvsearch",
        cat: "5000,5040",
        tmdbid: "1396", // Breaking Bad
        season: "1",
        ep: "1",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.text();
    expect(data).toContain("<rss");
    expect(data).toContain("<item>");
    expect(data).toContain("Breaking Bad");
  });

  it("searches tv show by text query with season (Sonarr request)", async () => {
    const client = testClient(app);

    const response = await client.api.$get({
      query: {
        t: "tvsearch",
        cat: "5000,5010,5020,5030,5040,5045,5050,5060,5070,5080",
        extended: "1",
        offset: "0",
        limit: "100",
        q: "Juego de Tronos",
        season: "8",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.text();
    expect(data).toContain("<rss");
  });

  it("searches tv show by tmdbid with season and episode (Game of Thrones S08E06)", async () => {
    const client = testClient(app);

    const response = await client.api.$get({
      query: {
        t: "tvsearch",
        cat: "5000,5010,5020,5030,5040,5045,5050,5060,5070,5080",
        extended: "1",
        offset: "0",
        limit: "100",
        tmdbid: "1399", // Game of Thrones
        season: "8",
        ep: "6",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.text();
    expect(data).toContain("<rss");
    expect(data).toContain("<item>");
  });

  it("returns error for unknown function type", async () => {
    const client = testClient(app);

    const response = await client.api.$get({
      query: {
        t: "unknown",
        cat: "5000,5040",
        offset: "0",
        limit: "100",
      },
    });

    expect(response.status).toBe(200);
    const data = await response.text();
    expect(data).toContain("<error");
  });
});

describe("movie", () => {
  it("searches movie by tmdbid (Interstellar)", async () => {
    const client = testClient(app);

    const response = await client.api.$get({
      query: {
        t: "movie",
        cat: "2000,2010,2020,2030,2040,2045,2050,2060",
        extended: "1",
        offset: "0",
        limit: "100",
        tmdbid: "157336", // Interstellar
      },
    });

    expect(response.status).toBe(200);
    const data = await response.text();
    expect(data).toContain("<rss");
    expect(data).toContain("<item>");
    expect(data).toContain("Interstellar");
  });
});
