import { z } from "zod";
import { CapsRequestSchema } from "./CapabilitiesRequestSchema.ts";
import { SearchRequestSchema } from "./SearchRequestSchema.ts";
import { TVSearchRequestSchema } from "./TVSearchRequestSchema.ts";
import { MovieSearchRequestSchema } from "./MovieSearchRequestSchema.ts";

export const QuerySchema = z.union([
  CapsRequestSchema,
  SearchRequestSchema,
  TVSearchRequestSchema,
  MovieSearchRequestSchema,
]);

export type TorznabRequest = z.infer<typeof QuerySchema>;
