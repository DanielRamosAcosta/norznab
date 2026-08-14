/**
 * Slug identifying a torrent source. Doubles as the value a \*arr indexer can put
 * in its Torznab `apikey` to query only that source (see {@link selectBySource}).
 */
export const ProviderSource = {
  DONTORRENT: "dontorrent",
  MARCIANOTORRENT: "marcianotorrent",
  WOLFMAX4K: "wolfmax4k",
} as const;

export type ProviderSource =
  (typeof ProviderSource)[keyof typeof ProviderSource];
