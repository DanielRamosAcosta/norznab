import { z } from "zod";

// Enums
export const ProtocolSchema = z
  .enum(["unknown", "usenet", "torrent"])
  .default("unknown");
export const MovieStatusSchema = z
  .enum(["tba", "announced", "inCinemas", "released", "deleted"])
  .default("tba");
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
export const MonitorSchema = z
  .enum(["movieOnly", "movieAndCollection", "none"])
  .default("movieOnly");
export const MinimumAvailabilitySchema = z
  .enum(["tba", "announced", "inCinemas", "released"])
  .default("released");
export const PrivacySchema = z
  .enum(["normal", "password", "apiKey", "userName"])
  .default("normal");

// Common nested types
export const MediaCoverSchema = z
  .object({
    coverType: z.string().optional(),
    url: z.string().optional(),
    remoteUrl: z.string().nullable().optional(),
  })
  .strict();

const RatingValueSchema = z
  .object({
    votes: z.number(),
    value: z.number(),
    type: z.string(),
  })
  .strict();

export const RatingsSchema = z
  .object({
    imdb: RatingValueSchema.optional(),
    tmdb: RatingValueSchema.optional(),
    metacritic: RatingValueSchema.optional(),
    rottenTomatoes: RatingValueSchema.optional(),
    trakt: RatingValueSchema.optional(),
  })
  .strict();

export const LanguageSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().optional(),
  })
  .strict();

export const SelectOptionSchema = z
  .object({
    value: z.unknown().optional(),
    name: z.string().nullable().optional(),
    order: z.number().optional(),
    hint: z.string().nullable().optional(),
    dividerAfter: z.boolean().optional(),
  })
  .strict();

// Type exports
export type Protocol = z.infer<typeof ProtocolSchema>;
export type MovieStatus = z.infer<typeof MovieStatusSchema>;
export type CommandStatus = z.infer<typeof CommandStatusSchema>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
export type CommandPriority = z.infer<typeof CommandPrioritySchema>;
export type CommandTrigger = z.infer<typeof CommandTriggerSchema>;
export type Monitor = z.infer<typeof MonitorSchema>;
export type MinimumAvailability = z.infer<typeof MinimumAvailabilitySchema>;
export type Privacy = z.infer<typeof PrivacySchema>;
export type MediaCover = z.infer<typeof MediaCoverSchema>;
export type Ratings = z.infer<typeof RatingsSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type SelectOption = z.infer<typeof SelectOptionSchema>;
