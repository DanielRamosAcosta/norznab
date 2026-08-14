import { ProviderSource } from "./ProviderSource.ts";

const KNOWN_SOURCES: ReadonlySet<string> = new Set(
  Object.values(ProviderSource),
);

/**
 * Narrows the provider adapters by the Torznab `apikey`, repurposed as a source
 * selector: a \*arr client can register one indexer per source and set its API
 * key to the source slug ("dontorrent", "marcianotorrent", "wolfmax4k") to query
 * only that source.
 *
 * - no key, or an arbitrary/real key → every provider (unchanged behaviour, so
 *   existing indexers configured with a random key keep working)
 * - a known source slug → only that source's adapters
 */
export function selectBySource<T extends { source: string }>(
  adapters: T[],
  apikey: string | undefined,
): T[] {
  const key = apikey?.trim().toLowerCase();
  if (!key || !KNOWN_SOURCES.has(key)) {
    return adapters;
  }
  return adapters.filter((adapter) => adapter.source === key);
}
