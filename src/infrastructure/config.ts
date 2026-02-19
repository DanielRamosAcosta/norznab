import z from "zod";

export const ConfigSchema = z.object({
  DON_TORRENT_BASE_URL: z.string(),
  MARCIANO_TORRENT_BASE_URL: z.string(),
  TMDB_API_KEY: z.string(),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
});

export const config = ConfigSchema.parse(process.env);
