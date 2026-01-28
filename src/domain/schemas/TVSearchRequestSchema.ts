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
});

const TVSearchGenericSchema = TVSearchBaseSchema.strict();

const TVSearchByTMDBSchema = TVSearchBaseSchema.extend({
  tmdbid: z.coerce.number(),
  season: z.coerce.number(),
  ep: z.coerce.number(),
}).strict();

export const TVSearchRequestSchema = z.union([
  TVSearchGenericSchema,
  TVSearchByTMDBSchema,
]);

export type TVSearchRequest = z.infer<typeof TVSearchRequestSchema>;
export type TVSearchByTMDB = z.infer<typeof TVSearchByTMDBSchema>;

export function isTVSearchRequest(req: { t: string }): req is TVSearchRequest {
  return req.t === TorznabFunction.TV_SEARCH;
}

export function isTVSearchByTMDB(req: TVSearchRequest): req is TVSearchByTMDB {
  return "tmdbid" in req && typeof req.tmdbid === "number";
}
