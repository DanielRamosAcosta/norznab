import { readFileSync } from "node:fs";
import { GenericContainer, Wait, TestContainers } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

export const SONARR_API_KEY = "E2E_API_KEY";

const sonarrConfigXml = readFileSync(
  new URL("../fixtures/sonarr.config.xml", import.meta.url),
  "utf-8",
);

export interface SonarrContainerInfo {
  container: StartedTestContainer;
  baseUrl: string;
  apiKey: string;
}

export async function startSonarrContainer(
  hostPort: number,
): Promise<SonarrContainerInfo> {
  await TestContainers.exposeHostPorts(hostPort);

  const container = await new GenericContainer(
    "lscr.io/linuxserver/sonarr:latest",
  )
    .withExposedPorts(8989)
    .withEnvironment({ PUID: "1000", PGID: "1000", TZ: "Etc/UTC" })
    .withCopyContentToContainer([
      {
        content: sonarrConfigXml,
        target: "/config/config.xml",
      },
    ])
    .withWaitStrategy(
      Wait.forHttp("/api/v3/system/status", 8989)
        .forStatusCode(200)
        .withHeaders({ "X-Api-Key": SONARR_API_KEY }),
    )
    .withStartupTimeout(120_000)
    .start();

  const mappedPort = container.getMappedPort(8989);
  const host = container.getHost();

  return {
    container,
    baseUrl: `http://${host}:${mappedPort}`,
    apiKey: SONARR_API_KEY,
  };
}
