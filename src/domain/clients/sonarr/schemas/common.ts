import { z } from "zod";

// Enums
export const ProtocolSchema = z
  .enum(["unknown", "usenet", "torrent"])
  .default("unknown");
export const SeriesTypeSchema = z
  .enum(["standard", "daily", "anime"])
  .default("standard");
export const EventTypeSchema = z
  .enum([
    "unknown",
    "grabbed",
    "seriesFolderImported",
    "downloadFolderImported",
    "downloadFailed",
    "episodeFileDeleted",
    "episodeFileRenamed",
    "downloadIgnored",
  ])
  .default("unknown");
export const SeriesStatusSchema = z
  .enum(["continuing", "ended", "upcoming", "deleted"])
  .default("upcoming");
export const CommandStatusSchema = z
  .enum([
    "queued",
    "started",
    "completed",
    "failed",
    "aborted",
    "cancelled",
    "orphaned",
  ])
  .default("queued");
export const CommandResultSchema = z
  .enum(["unknown", "successful", "unsuccessful"])
  .default("unknown");
export const CommandPrioritySchema = z
  .enum(["normal", "high", "low"])
  .default("normal");
export const CommandTriggerSchema = z
  .enum(["unspecified", "manual", "scheduled"])
  .default("unspecified");
export const MonitorNewItemsSchema = z.enum(["all", "none"]).default("all");
export const SortDirectionSchema = z
  .enum(["default", "ascending", "descending"])
  .default("default");
export const PrivacySchema = z
  .enum(["normal", "password", "apiKey", "userName"])
  .default("normal");

// Common nested types
export const MediaCoverSchema = z.object({
  coverType: z.string().optional(),
  url: z.string().optional(),
  remoteUrl: z.string().nullable().optional(),
}).strict();

export const RatingsSchema = z.object({
  votes: z.number().optional(),
  value: z.number().optional(),
}).strict();

export const LanguageSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
}).strict();

export const SelectOptionSchema = z.object({
  value: z.unknown().optional(),
  name: z.string().nullable().optional(),
  order: z.number().optional(),
  hint: z.string().nullable().optional(),
}).strict();

// Type exports
export type Protocol = z.infer<typeof ProtocolSchema>;
export type SeriesType = z.infer<typeof SeriesTypeSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;
export type SeriesStatus = z.infer<typeof SeriesStatusSchema>;
export type CommandStatus = z.infer<typeof CommandStatusSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
export type CommandPriority = z.infer<typeof CommandPrioritySchema>;
export type CommandTrigger = z.infer<typeof CommandTriggerSchema>;
export type MonitorNewItems = z.infer<typeof MonitorNewItemsSchema>;
export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type Privacy = z.infer<typeof PrivacySchema>;
export type MediaCover = z.infer<typeof MediaCoverSchema>;
export type Ratings = z.infer<typeof RatingsSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;
