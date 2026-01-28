import { z } from "zod";
import {
  MediaCoverSchema,
  RatingsSchema,
  MovieStatusSchema,
  MinimumAvailabilitySchema,
  LanguageSchema,
} from "./common.ts";

export const AddMovieOptionsSchema = z
  .object({
    ignoreEpisodesWithFiles: z.boolean().optional(),
    ignoreEpisodesWithoutFiles: z.boolean().optional(),
    monitor: z.string().optional(),
    searchForMovie: z.boolean().optional(),
    addMethod: z.string().optional(),
  })
  .strict();

export const AlternateTitleSchema = z
  .object({
    id: z.number().optional(),
    sourceType: z.string().optional(),
    movieMetadataId: z.number().optional(),
    title: z.string().nullable().optional(),
    cleanTitle: z.string().nullable().optional(),
  })
  .strict();

export const MovieStatisticsSchema = z
  .object({
    movieFileCount: z.number().optional(),
    sizeOnDisk: z.number().optional(),
    releaseGroups: z.array(z.string()).nullable().optional(),
  })
  .strict();

export const MovieSchema = z
  .object({
    id: z.number().optional(),
    title: z.string().nullable().optional(),
    originalTitle: z.string().nullable().optional(),
    originalLanguage: LanguageSchema.nullable().optional(),
    alternateTitles: z.array(AlternateTitleSchema).nullable().optional(),
    secondaryYearSourceId: z.number().optional(),
    sortTitle: z.string().nullable().optional(),
    status: MovieStatusSchema.optional(),
    overview: z.string().nullable().optional(),
    inCinemas: z.string().nullable().optional(),
    physicalRelease: z.string().nullable().optional(),
    digitalRelease: z.string().nullable().optional(),
    releaseDate: z.string().nullable().optional(),
    images: z.array(MediaCoverSchema).nullable().optional(),
    website: z.string().nullable().optional(),
    remotePoster: z.string().nullable().optional(),
    year: z.number().optional(),
    studio: z.string().nullable().optional(),
    path: z.string().nullable().optional(),
    qualityProfileId: z.number().optional(),
    hasFile: z.boolean().optional(),
    movieFileId: z.number().optional(),
    monitored: z.boolean().optional(),
    minimumAvailability: MinimumAvailabilitySchema.optional(),
    isAvailable: z.boolean().optional(),
    folderName: z.string().nullable().optional(),
    runtime: z.number().optional(),
    cleanTitle: z.string().nullable().optional(),
    imdbId: z.string().nullable().optional(),
    tmdbId: z.number().optional(),
    titleSlug: z.string().nullable().optional(),
    rootFolderPath: z.string().nullable().optional(),
    folder: z.string().nullable().optional(),
    certification: z.string().nullable().optional(),
    genres: z.array(z.string()).nullable().optional(),
    tags: z.array(z.number()).nullable().optional(),
    added: z.string().optional(),
    addOptions: AddMovieOptionsSchema.optional(),
    ratings: RatingsSchema.optional(),
    statistics: MovieStatisticsSchema.optional(),
    youTubeTrailerId: z.string().nullable().optional(),
    popularity: z.number().optional(),
    keywords: z.array(z.string()).optional(),
    sizeOnDisk: z.number().optional(),
    lastSearchTime: z.string().nullable().optional(),
  })
  .strict();

export type AddMovieOptions = z.infer<typeof AddMovieOptionsSchema>;
export type AlternateTitle = z.infer<typeof AlternateTitleSchema>;
export type MovieStatistics = z.infer<typeof MovieStatisticsSchema>;
export type Movie = z.infer<typeof MovieSchema>;
