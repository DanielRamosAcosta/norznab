import { z } from "zod";
import { SelectOptionSchema, PrivacySchema } from "./common.ts";

export const FieldSchema = z
  .object({
    order: z.number().optional(),
    name: z.string().nullable().optional(),
    label: z.string().nullable().optional(),
    value: z.unknown().optional(),
    type: z.string().nullable().optional(),
    advanced: z.boolean().optional(),
    selectOptions: z.array(SelectOptionSchema).nullable().optional(),
    helpText: z.string().nullable().optional(),
    section: z.string().nullable().optional(),
    privacy: PrivacySchema.optional(),
    isFloat: z.boolean().optional(),
    unit: z.string().nullable().optional(),
    hint: z.string().nullable().optional(),
    selectOptionsProviderAction: z.string().nullable().optional(),
  })
  .strict();

export type Field = z.infer<typeof FieldSchema>;
