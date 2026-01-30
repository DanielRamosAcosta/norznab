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
  });

  afterAll(async () => {
    await serverInfo?.server?.close();
    await radarr.flushQueue();
    await radarr.deleteAllIndexers();
    await radarr.deleteAllMovies();
    await radarrContainer?.stop();
  });

  // Skipped: Radarr requires external API access to api.radarr.video for movie lookup.
  // Corporate proxy (CN=core1.netops.test) intercepts SSL connections with self-signed certificate.
  // Host machine has proxy certs installed, but Docker containers don't, causing SSL validation failures.
  // From NAS: api.radarr.video is unreachable (100% packet loss), possibly due to ISP/geo-blocking.
  test.skip("search interstellar movie", async () => {
    const indexer = createIndexer(serverInfo.port);

    await radarr.testIndexer(indexer);
    await radarr.addIndexer(indexer);

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
