import { z } from "zod";

export const QualityGroupSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable().optional(),
  allowed: z.boolean().optional(),
}).strict();

export const QualityDefSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  weight: z.number().optional(),
  minSize: z.number().nullable().optional(),
  maxSize: z.number().nullable().optional(),
}).strict();

export const QualityProfileSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable().optional(),
  upgradeable: z.boolean().optional(),
  cutoff: z.number().optional(),
  items: z.array(QualityGroupSchema).nullable().optional(),
  minFormatScore: z.number().optional(),
  cutoffFormatScore: z.number().optional(),
  formatItems: z.array(z.unknown()).nullable().optional(),
}).strict();

export type QualityGroup = z.infer<typeof QualityGroupSchema>;
export type QualityDef = z.infer<typeof QualityDefSchema>;
export type QualityProfile = z.infer<typeof QualityProfileSchema>;
