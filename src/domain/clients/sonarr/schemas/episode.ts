import { z } from "zod";
import { MediaCoverSchema } from "./common.ts";
import { SeriesSchema } from "./series.ts";

export const EpisodeFileSchema = z
  .object({
    id: z.number().optional(),
    seriesId: z.number().optional(),
    seasonNumber: z.number().optional(),
    relativePath: z.string().nullable().optional(),
    path: z.string().nullable().optional(),
    size: z.number().optional(),
    dateAdded: z.string().nullable().optional(),
    sceneName: z.string().nullable().optional(),
    releaseGroup: z.string().nullable().optional(),
    quality: z.unknown().optional(),
    mediaInfo: z.unknown().optional(),
    originalFilePath: z.string().nullable().optional(),
  })
  .strict();

export const EpisodeSchema = z
  .object({
    id: z.number().optional(),
    seriesId: z.number().optional(),
    tvdbId: z.number().optional(),
    episodeFileId: z.number().optional(),
    seasonNumber: z.number().optional(),
    episodeNumber: z.number().optional(),
    title: z.string().nullable().optional(),
    airDate: z.string().nullable().optional(),
    airDateUtc: z.string().nullable().optional(),
    runtime: z.number().optional(),
    overview: z.string().nullable().optional(),
    episodeFile: EpisodeFileSchema.optional(),
    hasFile: z.boolean().optional(),
    monitored: z.boolean().optional(),
    unverifiedSceneNumbering: z.boolean().optional(),
    finaleType: z.string().nullable().optional(),
    absoluteEpisodeNumber: z.number().nullable().optional(),
    sceneEpisodeNumber: z.number().nullable().optional(),
    sceneSeasonNumber: z.number().nullable().optional(),
    series: SeriesSchema.optional(),
    images: z.array(MediaCoverSchema).nullable().optional(),
  })
  .strict();

export type EpisodeFile = z.infer<typeof EpisodeFileSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
