import { z } from "zod";

const AKACountrySchema = z
  .object({
    name: z.string(),
    code: z.string(),
    timezone: z.string(),
  })
  .strict();

export const AKASchema = z
  .object({
    name: z.string(),
    country: AKACountrySchema.nullable(),
  })
  .strict();

export type AKA = z.infer<typeof AKASchema>;

export function getSpanishName(akas: AKA[]) {
  return akas.find((aka) => aka.country?.code === "ES")?.name;
}

export const AKAListSchema = z.array(AKASchema);
