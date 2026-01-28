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
