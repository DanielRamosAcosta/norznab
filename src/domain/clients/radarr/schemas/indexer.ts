import { z } from "zod";
import { ProtocolSchema } from "./common.ts";
import { FieldSchema } from "./field.ts";

export const ProviderMessageSchema = z
  .object({
    message: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
  })
  .strict();

export const IndexerSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().nullable().optional(),
    implementation: z.string().nullable().optional(),
    implementationName: z.string().nullable().optional(),
    configContract: z.string().nullable().optional(),
    protocol: ProtocolSchema.optional(),
    enableRss: z.boolean().optional(),
    enableAutomaticSearch: z.boolean().optional(),
    enableInteractiveSearch: z.boolean().optional(),
    supportsRss: z.boolean().optional(),
    supportsSearch: z.boolean().optional(),
    priority: z.number().optional(),
    fields: z.array(FieldSchema).nullable().optional(),
    downloadClientId: z.number().optional(),
    tags: z.array(z.number()).nullable().optional(),
    presets: z.array(z.unknown()).nullable().optional(),
    message: ProviderMessageSchema.optional(),
    infoLink: z.string().nullable().optional(),
    enable: z.boolean().optional(),
  })
  .strict();

export type ProviderMessage = z.infer<typeof ProviderMessageSchema>;
export type Indexer = z.infer<typeof IndexerSchema>;
