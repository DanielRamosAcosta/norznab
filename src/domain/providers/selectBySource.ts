/**
 * Selects the provider adapters for a request by its Torznab `apikey`, which
 * norznab repurposes as a source selector. Each source is exposed as its own
 * indexer: register one Torznab indexer per source in Radarr/Sonarr, all
 * pointing at the same norznab server, each with its API key set to the source
 * slug ("dontorrent", "marcianotorrent", "wolfmax4k", "elitetorrent").
 *
 * A request only returns results when its key matches a source slug; a missing
 * or unknown key selects no source (and therefore no results), so every indexer
 * must target a specific source.
 */
export function selectBySource<T extends { source: string }>(
  adapters: T[],
  apikey: string | undefined,
): T[] {
  const key = apikey?.trim().toLowerCase() ?? "";
  return adapters.filter((adapter) => adapter.source === key);
}
