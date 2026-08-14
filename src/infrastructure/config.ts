import z from "zod";

const boolFromEnv = z
  .enum(["true", "false"])
  .default("true")
  .transform((v) => v === "true");

export const ConfigSchema = z.object({
  DON_TORRENT_BASE_URL: z.string(),
  MARCIANO_TORRENT_BASE_URL: z.string(),
  WOLFMAX4K_BASE_URL: z.string().default("https://wolfmax4k.com"),
  // Per-request timeout for wolfmax HTTP/3 + enlacito calls. Kept short and
  // decoupled from REQUEST_TIMEOUT_MS so a stalled QUIC request fails fast
  // (and is retried) instead of pinning the whole search for 2 minutes.
  WOLFMAX4K_HTTP_TIMEOUT_MS: z.coerce.number().default(15_000),
  TMDB_API_KEY: z.string(),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
  ENABLE_DON_TORRENT: boolFromEnv,
  ENABLE_MARCIANO_TORRENT: boolFromEnv,
  ENABLE_WOLFMAX4K: boolFromEnv,
});

export const config = ConfigSchema.parse(process.env);
