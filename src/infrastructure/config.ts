import z from "zod";

export const ConfigSchema = z.object({
  DON_TORRENT_BASE_URL: z.string(),
  TMDB_API_KEY: z.string(),
});

export const config = ConfigSchema.parse(process.env);
