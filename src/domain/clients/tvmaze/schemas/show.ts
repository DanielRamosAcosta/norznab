import { z } from "zod";

const CountrySchema = z
  .object({
    name: z.string(),
    code: z.string(),
    timezone: z.string(),
  })
  .strict();

const NetworkSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    country: CountrySchema,
    officialSite: z.string().nullable(),
  })
  .strict();

const ScheduleSchema = z
  .object({
    time: z.string(),
    days: z.array(z.string()),
  })
  .strict();

const RatingSchema = z
  .object({
    average: z.number().nullable(),
  })
  .strict();

const ExternalsSchema = z
  .object({
    tvrage: z.number().nullable(),
    thetvdb: z.number().nullable(),
    imdb: z.string().nullable(),
  })
  .strict();

const ImageSchema = z
  .object({
    medium: z.string(),
    original: z.string(),
  })
  .strict();

const LinkSchema = z
  .object({
    href: z.string(),
    name: z.string().optional(),
  })
  .strict();

const LinksSchema = z
  .object({
    self: LinkSchema,
    previousepisode: LinkSchema.optional(),
    nextepisode: LinkSchema.optional(),
  })
  .strict();

export const TVMazeShowSchema = z
  .object({
    id: z.number(),
    url: z.string(),
    name: z.string(),
    type: z.string(),
    language: z.string().nullable(),
    genres: z.array(z.string()),
    status: z.string(),
    runtime: z.number().nullable(),
    averageRuntime: z.number().nullable(),
    premiered: z.string().nullable(),
    ended: z.string().nullable(),
    officialSite: z.string().nullable(),
    schedule: ScheduleSchema,
    rating: RatingSchema,
    weight: z.number(),
    network: NetworkSchema.nullable(),
    webChannel: z.unknown().nullable(),
    dvdCountry: z.unknown().nullable(),
    externals: ExternalsSchema,
    image: ImageSchema.nullable(),
    summary: z.string().nullable(),
    updated: z.number(),
    _links: LinksSchema,
  })
  .strict();

export type TVMazeShow = z.infer<typeof TVMazeShowSchema>;

export const SearchResultSchema = z.array(
  z
    .object({
      score: z.number(),
      show: TVMazeShowSchema,
    })
    .strict(),
);
