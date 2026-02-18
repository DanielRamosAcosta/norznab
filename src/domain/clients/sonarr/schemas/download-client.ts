import { z } from "zod";
import { FieldSchema } from "./field.ts";

export const DownloadClientSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().nullable().optional(),
    implementation: z.string().nullable().optional(),
    implementationName: z.string().nullable().optional(),
    configContract: z.string().nullable().optional(),
    enable: z.boolean().optional(),
    protocol: z.string().nullable().optional(),
    priority: z.number().optional(),
    fields: z.array(FieldSchema).nullable().optional(),
    tags: z.array(z.number()).nullable().optional(),
  })
  .strict();

export type DownloadClient = z.infer<typeof DownloadClientSchema>;
