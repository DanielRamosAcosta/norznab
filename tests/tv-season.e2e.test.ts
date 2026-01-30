import { test, describe, expect, beforeAll, afterAll } from "vitest";
import type { StartedTestContainer } from "testcontainers";
import { app } from "../src/infrastructure/hono/app.ts";
import { Sonarr } from "../src/domain/clients/sonarr/Sonarr.ts";
import {
  startSonarrContainer,
  SONARR_API_KEY,
} from "./utils/sonarrContainer.ts";
import { serveRandom, type ServerInfo } from "./utils/serveRandom.ts";
import { waitFor } from "./utils/waitFor.ts";
import { createIndexer } from "./factories/createIndexer.ts";

describe("TV Season search", { timeout: 180_000 }, () => {
  let sonarr: Sonarr;
  let serverInfo: ServerInfo;
  let sonarrContainer: StartedTestContainer;

  beforeAll(async () => {
    serverInfo = await serveRandom(app);

    const containerInfo = await startSonarrContainer(serverInfo.port);
    sonarrContainer = containerInfo.container;

    sonarr = new Sonarr({
      baseUrl: containerInfo.baseUrl,
      apiKey: SONARR_API_KEY,
    });

    await sonarr.flushQueue();
    await sonarr.deleteAllIndexers();
    await sonarr.deleteAllSeries();
  });

  afterAll(async () => {
    await serverInfo?.server?.close();
    await sonarr.flushQueue();
    await sonarr.deleteAllIndexers();
    await sonarr.deleteAllSeries();
    await sonarrContainer?.stop();
  });

  test("search tv season", async () => {
    const indexer = createIndexer(serverInfo.port);

    await sonarr.testIndexer(indexer);
    await sonarr.addIndexer(indexer);

    const [breakingBad] = await sonarr.searchSeries("breaking bad");

    const addedSeries = await sonarr.addSeries({
      title: breakingBad.title,
      tvdbId: breakingBad.tvdbId,
      titleSlug: breakingBad.titleSlug,
      images: breakingBad.images,
      seasons: breakingBad.seasons,
      qualityProfileId: 1,
      seriesType: "standard",
      monitored: true,
      path: "/tv/breaking-bad",
      addOptions: {
        monitor: "all",
        searchForMissingEpisodes: false,
        searchForCutoffUnmetEpisodes: false,
      },
    });

    await waitFor(async () => {
      expect((await sonarr.getEpisodes(addedSeries.id)).length).toBeGreaterThan(
        0,
      );
    });

    await sonarr.runCommand({
      name: "SeasonSearch",
      seriesId: addedSeries.id!,
      seasonNumber: 1,
    });

    await waitFor(
      async () => {
        const queue = await sonarr.getQueue();
        expect(queue.records?.length).toEqual(7);
      },
      { timeout: 20_000 },
    );
  });
});
