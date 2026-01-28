import { z } from "zod";

export const HealthSchema = z.object({
  source: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  wikiUrl: z.string().nullable().optional(),
}).strict();

export type Health = z.infer<typeof HealthSchema>;
