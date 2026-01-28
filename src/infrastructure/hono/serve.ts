import { serve } from "@hono/node-server";
import { app } from "./app.ts";

// Start server
serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`✓ Norznab API running at http://localhost:${info.port}`);
    console.log(`Try: curl "http://localhost:${info.port}/api?t=caps"`);
  },
);
