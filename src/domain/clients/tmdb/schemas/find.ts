import { z } from "zod";

export const TVResultSchema = z.object({
  adult: z.boolean(),
  backdrop_path: z.string().nullable(),
  id: z.number(),
  name: z.string(),
  original_name: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  media_type: z.string(),
  original_language: z.string(),
  genre_ids: z.array(z.number()),
  popularity: z.number(),
  first_air_date: z.string(),
  vote_average: z.number(),
  vote_count: z.number(),
  origin_country: z.array(z.string()),
}).strict();

export type TVResultSchema = z.infer<typeof TVResultSchema>;

export const FindResponseSchema = z.object({
  movie_results: z.array(z.unknown()),
  person_results: z.array(z.unknown()),
  tv_results: z.array(TVResultSchema),
  tv_episode_results: z.array(z.unknown()),
  tv_season_results: z.array(z.unknown()),
}).strict();

export type TVResult = z.infer<typeof TVResultSchema>;
export type FindResponse = z.infer<typeof FindResponseSchema>;
