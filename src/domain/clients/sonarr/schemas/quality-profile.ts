import { z } from "zod";

export const QualityGroupSchema: z.ZodType<any> = z.lazy(() =>
  z
    .object({
      id: z.number().optional(),
      name: z.string().nullable().optional(),
      allowed: z.boolean(),
      quality: z.unknown(),
      items: z.array(QualityGroupSchema).nullable(),
    })
    .strict(),
);

export const QualityDefSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    weight: z.number().optional(),
    minSize: z.number().nullable().optional(),
    maxSize: z.number().nullable().optional(),
  })
  .strict();

export const QualityProfileSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable(),
    upgradeable: z.boolean().optional(),
    cutoff: z.number(),
    items: z.array(QualityGroupSchema).nullable(),
    minFormatScore: z.number(),
    cutoffFormatScore: z.number(),
    formatItems: z.array(z.unknown()).nullable(),
    upgradeAllowed: z.boolean(),
    minUpgradeFormatScore: z.number(),
  })
  .strict();

export type QualityGroup = z.infer<typeof QualityGroupSchema>;
export type QualityDef = z.infer<typeof QualityDefSchema>;
export type QualityProfile = z.infer<typeof QualityProfileSchema>;
