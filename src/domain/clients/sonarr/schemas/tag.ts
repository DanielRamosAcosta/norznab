import { z } from "zod";

export const TagSchema = z.object({
  id: z.number().optional(),
  label: z.string().nullable().optional(),
}).strict();

export type Tag = z.infer<typeof TagSchema>;
