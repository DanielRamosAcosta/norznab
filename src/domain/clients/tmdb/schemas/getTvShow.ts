import { z } from "zod";

export const GetTVShowResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  original_name: z.string(),
  overview: z.string(),
  first_air_date: z.string(),
});

export type GetTVShowResponse = z.infer<typeof GetTVShowResponseSchema>;
