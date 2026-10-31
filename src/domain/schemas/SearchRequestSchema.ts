import { z } from "zod";
import { TorznabFunction } from "./TorznabFunction.ts";

// Generic search mode (t=search). Prowlarr requires this mode for its
// "Generic Torznab" indexer test and for free-text searches. Without a query
// it is a connectivity test; with `q` it performs a free-text search.
export const SearchRequestSchema = z
  .object({
    t: z.literal(TorznabFunction.SEARCH),
    cat: z
      .string()
      .transform((val) => val.split(",").map((n) => z.coerce.number().parse(n)))
      .optional(),
    extended: z.coerce.boolean().optional(),
    offset: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
    apikey: z.string().optional(),
    q: z.coerce.string().optional(),
  })
  .strict();

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export function isSearchRequest(req: { t: string }): req is SearchRequest {
  return req.t === TorznabFunction.SEARCH;
}

export function isSearchTestRequest(req: SearchRequest): boolean {
  return !req.q;
}
