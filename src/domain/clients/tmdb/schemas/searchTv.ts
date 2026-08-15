import { z } from "zod";

export const SearchTVResultSchema = z
  .object({
    adult: z.boolean(),
    softcore: z.boolean(),
    backdrop_path: z.string().nullable(),
    id: z.number(),
    name: z.string(),
    original_name: z.string(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    original_language: z.string(),
    genre_ids: z.array(z.number()),
    popularity: z.number(),
    first_air_date: z.string(),
    vote_average: z.number(),
    vote_count: z.number(),
    origin_country: z.array(z.string()),
  });

export const SearchTVResponseSchema = z
  .object({
    page: z.number(),
    results: z.array(SearchTVResultSchema),
    total_pages: z.number(),
    total_results: z.number(),
  })
  .strict();

export type SearchTVResult = z.infer<typeof SearchTVResultSchema>;
export type SearchTVResponse = z.infer<typeof SearchTVResponseSchema>;
