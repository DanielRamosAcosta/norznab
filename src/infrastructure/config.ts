import z from "zod";

export const ConfigSchema = z.object({
  TMDB_API_KEY: z.string(),
});

export const config = ConfigSchema.parse(process.env);
