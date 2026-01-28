import { z } from "zod";
import { TorznabFunction } from "./TorznabFunction.ts";

const MovieSearchBaseSchema = z.object({
  t: z.literal(TorznabFunction.MOVIE),
  cat: z
    .string()
    .transform((val) => val.split(",").map((n) => z.coerce.number().parse(n)))
    .optional(),
  extended: z.coerce.boolean().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  apikey: z.string().optional(),
});

const MovieSearchGenericSchema = MovieSearchBaseSchema.strict();

const MovieSearchByTMDBSchema = MovieSearchBaseSchema.extend({
  tmdbid: z.coerce.number(),
}).strict();

export const MovieSearchRequestSchema = z.union([
  MovieSearchGenericSchema,
  MovieSearchByTMDBSchema,
]);

export type MovieSearchRequest = z.infer<typeof MovieSearchRequestSchema>;
export type MovieSearchByTMDB = z.infer<typeof MovieSearchByTMDBSchema>;

export function isMovieSearchRequest(req: {
  t: string;
}): req is MovieSearchRequest {
  return req.t === TorznabFunction.MOVIE;
}

export function isMovieSearchByTMDB(
  req: MovieSearchRequest,
): req is MovieSearchByTMDB {
  return "tmdbid" in req && typeof req.tmdbid === "number";
}
