import z from "zod";

const boolFromEnv = z
  .enum(["true", "false"])
  .default("true")
  .transform((v) => v === "true");

export const ConfigSchema = z.object({
  DON_TORRENT_BASE_URL: z.string(),
  MARCIANO_TORRENT_BASE_URL: z.string(),
  TMDB_API_KEY: z.string(),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
  ENABLE_DON_TORRENT: boolFromEnv,
  ENABLE_MARCIANO_TORRENT: boolFromEnv,
});

export const config = ConfigSchema.parse(process.env);
