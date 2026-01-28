import { serve } from "@hono/node-server";
import type { Hono } from "hono";
import { app as honoApp } from "../../src/infrastructure/hono/app.ts";

export interface ServerInfo {
  server: Awaited<ReturnType<typeof serve>>;
  port: number;
}

export function serveRandom(app: typeof honoApp): Promise<ServerInfo> {
  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      resolve({ server, port: info.port });
    });
  });
}
