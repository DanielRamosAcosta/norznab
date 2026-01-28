import { readFileSync } from "node:fs";
import { GenericContainer, Wait, TestContainers } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

export const RADARR_API_KEY = "E2E_API_KEY";

const radarrConfigXml = readFileSync(
  new URL("../fixtures/radarr.config.xml", import.meta.url),
  "utf-8",
);

export interface RadarrContainerInfo {
  container: StartedTestContainer;
  baseUrl: string;
  apiKey: string;
}

export async function startRadarrContainer(
  hostPort: number,
): Promise<RadarrContainerInfo> {
  await TestContainers.exposeHostPorts(hostPort);

  const container = await new GenericContainer(
    "lscr.io/linuxserver/radarr:latest",
  )
    .withExposedPorts(7878)
    .withEnvironment({ PUID: "1000", PGID: "1000", TZ: "Etc/UTC" })
    .withCopyContentToContainer([
      {
        content: radarrConfigXml,
        target: "/config/config.xml",
      },
    ])
    .withWaitStrategy(
      Wait.forHttp("/api/v3/system/status", 7878)
        .forStatusCode(200)
        .withHeaders({ "X-Api-Key": RADARR_API_KEY }),
    )
    .withStartupTimeout(120_000)
    .start();

  const mappedPort = container.getMappedPort(7878);
  const host = container.getHost();

  return {
    container,
    baseUrl: `http://${host}:${mappedPort}`,
    apiKey: RADARR_API_KEY,
  };
}
