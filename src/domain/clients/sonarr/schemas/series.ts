import { z } from "zod";
import {
  MediaCoverSchema,
  RatingsSchema,
  SeriesTypeSchema,
  SeriesStatusSchema,
  MonitorNewItemsSchema,
  LanguageSchema,
} from "./common.ts";

export const SeriesStatisticsSchema = z.object({
  seasonCount: z.number().optional(),
  episodeFileCount: z.number().optional(),
  episodeCount: z.number().optional(),
  totalEpisodeCount: z.number().optional(),
  sizeOnDisk: z.number().optional(),
  releaseGroups: z.array(z.string()).nullable().optional(),
  percentOfEpisodes: z.number().optional(),
}).strict();

export const SeasonSchema = z.object({
  seasonNumber: z.number().optional(),
  monitored: z.boolean().optional(),
  statistics: SeriesStatisticsSchema.optional(),
  percentOfEpisodes: z.number().optional(),
}).strict();

export const AlternateTitleSchema = z.object({
  title: z.string().nullable().optional(),
  seasonNumber: z.number().optional(),
}).strict();

export const AddSeriesOptionsSchema = z.object({
  ignoreEpisodesWithFiles: z.boolean().optional(),
  ignoreEpisodesWithoutFiles: z.boolean().optional(),
  searchForCutoffUnmetEpisodes: z.boolean().optional(),
}).strict();

export const SeriesSchema = z.object({
  id: z.number().optional(),
  title: z.string().nullable().optional(),
  alternateTitles: z.array(AlternateTitleSchema).nullable().optional(),
  sortTitle: z.string().nullable().optional(),
  status: SeriesStatusSchema.optional(),
  ended: z.boolean().optional(),
  overview: z.string().nullable().optional(),
  network: z.string().nullable().optional(),
  images: z.array(MediaCoverSchema).nullable().optional(),
  remotePoster: z.string().nullable().optional(),
  seasons: z.array(SeasonSchema).nullable().optional(),
  year: z.number().optional(),
  path: z.string().nullable().optional(),
  qualityProfileId: z.number().optional(),
  monitored: z.boolean().optional(),
  monitorNewItems: MonitorNewItemsSchema.optional(),
  runtime: z.number().optional(),
  tvdbId: z.number().optional(),
  tvRageId: z.number().optional(),
  tvMazeId: z.number().optional(),
  tmdbId: z.number().optional(),
  seriesType: SeriesTypeSchema.optional(),
  titleSlug: z.string().nullable().optional(),
  imdbId: z.string().nullable().optional(),
  genres: z.array(z.string()).nullable().optional(),
  tags: z.array(z.number()).nullable().optional(),
  added: z.string().optional(),
  addOptions: AddSeriesOptionsSchema.optional(),
  ratings: RatingsSchema.optional(),
  statistics: SeriesStatisticsSchema.optional(),
  airTime: z.string().nullable().optional(),
  originalLanguage: LanguageSchema.nullable().optional(),
  folder: z.string().nullable().optional(),
  seasonFolder: z.boolean().optional(),
  useSceneNumbering: z.boolean().optional(),
  firstAired: z.string().nullable().optional(),
  lastAired: z.string().nullable().optional(),
  cleanTitle: z.string().nullable().optional(),
  rootFolderPath: z.string().nullable().optional(),
  certification: z.string().nullable().optional(),
  languageProfileId: z.number().optional(),
}).strict();

export type Season = z.infer<typeof SeasonSchema>;
export type AlternateTitle = z.infer<typeof AlternateTitleSchema>;
export type AddSeriesOptions = z.infer<typeof AddSeriesOptionsSchema>;
export type SeriesStatistics = z.infer<typeof SeriesStatisticsSchema>;
export type Series = z.infer<typeof SeriesSchema>;
