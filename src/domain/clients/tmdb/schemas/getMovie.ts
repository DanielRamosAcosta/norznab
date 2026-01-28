import { z } from "zod";

export const GetMovieResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string(),
  overview: z.string(),
  release_date: z.string(),
});

export type GetMovieResponse = z.infer<typeof GetMovieResponseSchema>;
