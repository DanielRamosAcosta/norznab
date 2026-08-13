import { z } from "zod";

/**
 * A single release entry inside `data.datafinds`.
 *
 * The source is loose with nullability: `calidad`, `torrentName` and `image`
 * come back as `null` for some entries, so they are modelled as nullable and
 * normalised by the scrapper.
 */
export const Wolfmax4kFindItemSchema = z
  .object({
    guid: z.string(),
    calidad: z.string().nullable(),
    torrentName: z.string().nullable(),
    pic: z.string().nullable(),
    picc: z.string().nullable(),
    image: z.string().nullable(),
  })
  .strict();

export type Wolfmax4kFindItem = z.infer<typeof Wolfmax4kFindItemSchema>;

const Wolfmax4kFindDataSchema = z
  .object({
    pgcount: z.number(),
    pg: z.string(),
    message: z.string(),
    cidr: z.string(),
    c: z.string(),
    results: z.number(),
    // `datafinds` is `{ "0": { "0": item, "1": item, ... } }`; the inner group
    // is an empty object `{}` when there are no results.
    datafinds: z.record(
      z.string(),
      z.record(z.string(), Wolfmax4kFindItemSchema),
    ),
  })
  .strict();

/** Error envelope, e.g. `{ data: { message: "Message: No Referrer" } }`. */
const Wolfmax4kFindErrorSchema = z
  .object({
    message: z.string(),
  })
  .strict();

export const Wolfmax4kFindResponseSchema = z
  .object({
    response: z.boolean(),
    data: z.union([Wolfmax4kFindDataSchema, Wolfmax4kFindErrorSchema]),
  })
  .strict();

export type Wolfmax4kFindResponse = z.infer<typeof Wolfmax4kFindResponseSchema>;
export type Wolfmax4kFindData = z.infer<typeof Wolfmax4kFindDataSchema>;

export function isFindData(
  data: Wolfmax4kFindResponse["data"],
): data is Wolfmax4kFindData {
  return "datafinds" in data;
}
