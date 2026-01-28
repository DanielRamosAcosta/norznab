import { z } from "zod";
import {
  EventTypeSchema,
  LanguageSchema,
  SortDirectionSchema,
} from "./common.ts";
import { EpisodeSchema } from "./episode.ts";
import { SeriesSchema } from "./series.ts";

export const QualityModelSchema = z.object({
  quality: z.unknown().optional(),
  revision: z.unknown().optional(),
}).strict();

export const CustomFormatSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullable().optional(),
}).strict();

export const HistorySchema = z.object({
  id: z.number().optional(),
  episodeId: z.number().optional(),
  seriesId: z.number().optional(),
  sourceTitle: z.string().nullable().optional(),
  languages: z.array(LanguageSchema).nullable().optional(),
  quality: QualityModelSchema.optional(),
  customFormats: z.array(CustomFormatSchema).nullable().optional(),
  date: z.string().nullable().optional(),
  downloadId: z.string().nullable().optional(),
  eventType: EventTypeSchema.optional(),
  data: z.record(z.string(), z.string().nullable()).nullable().optional(),
  episode: EpisodeSchema.optional(),
  series: SeriesSchema.optional(),
}).strict();

export const HistoryPagingSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  sortKey: z.string().nullable().optional(),
  sortDirection: SortDirectionSchema.optional(),
  totalRecords: z.number().optional(),
  records: z.array(HistorySchema).nullable().optional(),
}).strict();

export type QualityModel = z.infer<typeof QualityModelSchema>;
export type CustomFormat = z.infer<typeof CustomFormatSchema>;
export type History = z.infer<typeof HistorySchema>;
export type HistoryPaging = z.infer<typeof HistoryPagingSchema>;
