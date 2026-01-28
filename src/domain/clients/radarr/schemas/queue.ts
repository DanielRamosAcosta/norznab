import { z } from "zod";

export const QueueItemSchema = z
  .object({
    id: z.number().optional(),
    movieId: z.number().optional(),
    title: z.string().nullable().optional(),
    size: z.number().optional(),
    sizeleft: z.number().optional(),
    timeleft: z.string().nullable().optional(),
    estimatedCompletionTime: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    trackedDownloadStatus: z.string().nullable().optional(),
    trackedDownloadState: z.string().nullable().optional(),
    downloadId: z.string().nullable().optional(),
    protocol: z.string().nullable().optional(),
    downloadClient: z.string().nullable().optional(),
    indexer: z.string().nullable().optional(),
    outputPath: z.string().nullable().optional(),
    languages: z.array(z.unknown()).nullable().optional(),
    quality: z.unknown().optional(),
    customFormats: z.array(z.unknown()).nullable().optional(),
    customFormatScore: z.number().optional(),
    added: z.string().nullable().optional(),
    statusMessages: z.array(z.unknown()).nullable().optional(),
    downloadClientHasPostImportCategory: z.boolean().optional(),
    movieHasFile: z.boolean().optional(),
  })
  .strict();

export const QueueSchema = z
  .object({
    page: z.number().optional(),
    pageSize: z.number().optional(),
    sortKey: z.string().nullable().optional(),
    sortDirection: z.string().nullable().optional(),
    totalRecords: z.number().optional(),
    records: z.array(QueueItemSchema).nullable().optional(),
  })
  .strict();

export type QueueItem = z.infer<typeof QueueItemSchema>;
export type Queue = z.infer<typeof QueueSchema>;
