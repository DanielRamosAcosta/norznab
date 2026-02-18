import { test, describe, expect, beforeAll, afterAll } from "vitest";
import type { StartedTestContainer } from "testcontainers";
import { app } from "../src/infrastructure/hono/app.ts";
import { Radarr } from "../src/domain/clients/radarr/Radarr.ts";
import {
  startRadarrContainer,
  RADARR_API_KEY,
} from "./utils/radarrContainer.ts";
import { serveRandom, type ServerInfo } from "./utils/serveRandom.ts";
import { waitFor } from "./utils/waitFor.ts";
import { createIndexer } from "./factories/createIndexer.ts";

describe("Movie E2E Search", { timeout: 180_000 }, () => {
  let radarr: Radarr;
  let serverInfo: ServerInfo;
  let radarrContainer: StartedTestContainer;

  beforeAll(async () => {
    serverInfo = await serveRandom(app);

    const containerInfo = await startRadarrContainer(serverInfo.port);
    radarrContainer = containerInfo.container;

    radarr = new Radarr({
      baseUrl: containerInfo.baseUrl,
      apiKey: RADARR_API_KEY,
    });

    await radarr.flushQueue();
    await radarr.deleteAllIndexers();
    await radarr.deleteAllMovies();
    const indexer = createIndexer(serverInfo.port);
    await radarr.testIndexer(indexer);
    await radarr.addIndexer(indexer);
  });

  afterAll(async () => {
    await serverInfo?.server?.close();
    await radarr.flushQueue();
    await radarr.deleteAllIndexers();
    await radarr.deleteAllMovies();
    await radarrContainer?.stop();
  });

  test("search a silent voice movie", async () => {
    const [aSilentVoice] = await radarr.searchMovie("a silent voice");

    const addedMovie = await radarr.addMovie({
      title: aSilentVoice.title,
      tmdbId: aSilentVoice.tmdbId,
      titleSlug: aSilentVoice.titleSlug,
      images: aSilentVoice.images,
      qualityProfileId: 1,
      monitored: true,
      path: "/movies/a-silent-voice",
      minimumAvailability: "released",
    });

    await waitFor(
      async () => {
        const movie = await radarr.getMovieById(addedMovie.id!);
        expect(movie.alternateTitles?.length).toBeGreaterThan(0);
      },
      { timeout: 15_000 },
    );

    await radarr.runCommand({
      name: "MoviesSearch",
      movieIds: [addedMovie.id!],
    });

    await waitFor(
      async () => {
        const queue = await radarr.getQueue();
        expect(queue.records?.length).toBeGreaterThan(0);
      },
      { timeout: 20_000 },
    );
  });

  test("search interstellar movie", async () => {
    const [interstellar] = await radarr.searchMovie("interstellar");

    const addedMovie = await radarr.addMovie({
      title: interstellar.title,
      tmdbId: interstellar.tmdbId,
      titleSlug: interstellar.titleSlug,
      images: interstellar.images,
      qualityProfileId: 1,
      monitored: true,
      path: "/movies/interstellar",
      minimumAvailability: "released",
    });

    await waitFor(
      async () => {
        const movie = await radarr.getMovieById(addedMovie.id!);
        expect(movie.alternateTitles?.length).toBeGreaterThan(0);
      },
      { timeout: 15_000 },
    );

    await radarr.runCommand({
      name: "MoviesSearch",
      movieIds: [addedMovie.id!],
    });

    await waitFor(
      async () => {
        const queue = await radarr.getQueue();
        expect(queue.records?.length).toBeGreaterThan(0);
      },
      { timeout: 20_000 },
    );
  });
});
