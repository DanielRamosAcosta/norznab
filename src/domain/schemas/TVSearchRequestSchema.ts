import { z } from "zod";
import { TorznabFunction } from "./TorznabFunction.ts";

const TVSearchBaseSchema = z.object({
  t: z.literal(TorznabFunction.TV_SEARCH),
  cat: z
    .string()
    .transform((val) => val.split(",").map((n) => z.coerce.number().parse(n)))
    .optional(),
  extended: z.coerce.boolean().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  apikey: z.string().optional(),

  // search methods
  tmdbid: z.coerce.number().optional(),
  tvdbid: z.coerce.number().optional(),
  rid: z.coerce.number().optional(),
  tvmazeid: z.coerce.number().optional(),
  imdbid: z.coerce.string().optional(),
  q: z.coerce.string().optional(),
});

// {imdbId:tt1839578}{tvdbId:248742}{rId:28376}{tvMazeId:2}{season:1}

const TVSearchGenericSchema = TVSearchBaseSchema.strict();

const TVSearchByEpisodeSchema = TVSearchBaseSchema.extend({
  season: z.coerce.number(),
  ep: z.coerce.number(),
}).strict();

const TVSearchBySeasonSchema = TVSearchBaseSchema.extend({
  season: z.coerce.number(),
}).strict();

export const TVSearchRequestSchema = z.union([
  TVSearchGenericSchema,
  TVSearchByEpisodeSchema,
  TVSearchBySeasonSchema,
]);

export type TVSearchRequest = z.infer<typeof TVSearchRequestSchema>;
export type TVSearchByEpisode = z.infer<typeof TVSearchByEpisodeSchema>;
export type TVSearchBySeason = z.infer<typeof TVSearchBySeasonSchema>;

export function isTVSearchRequest(req: { t: string }): req is TVSearchRequest {
  return req.t === TorznabFunction.TV_SEARCH;
}

export function isTVSearchByEpisode(
  req: TVSearchRequest,
): req is TVSearchByEpisode {
  return (
    "season" in req &&
    typeof req.season === "number" &&
    "ep" in req &&
    typeof req.ep === "number"
  );
}

export function isTVSearchBySeason(
  req: TVSearchRequest,
): req is TVSearchBySeason {
  return "season" in req && typeof req.season === "number";
}

export function isTestRequest(request: TVSearchRequest) {
  return (
    !("tmdbid" in request) &&
    !("tvdbid" in request) &&
    !("rid" in request) &&
    !("tvmazeid" in request) &&
    !("imdbid" in request) &&
    !("q" in request)
  );
}
