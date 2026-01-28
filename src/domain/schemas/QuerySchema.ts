import { z } from "zod";
import { CapsRequestSchema } from "./CapabilitiesRequestSchema.ts";
import { TVSearchRequestSchema } from "./TVSearchRequestSchema.ts";
import { MovieSearchRequestSchema } from "./MovieSearchRequestSchema.ts";

export const QuerySchema = z.union([
  CapsRequestSchema,
  TVSearchRequestSchema,
  MovieSearchRequestSchema,
]);

export type TorznabRequest = z.infer<typeof QuerySchema>;
