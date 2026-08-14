import type { TorznabItemTV } from "../models/TorznabItemTV.ts";
import type { SearchCriteria } from "./SearchCriteria.ts";
import type { ProviderSource } from "./ProviderSource.ts";

/**
 * A TV provider adapter: given a season/episode search criteria it returns the
 * matching Torznab items. Implemented by every torrent source (DonTorrent,
 * wolfmax4k, ...) so the TV search handler can aggregate all of them.
 */
export interface TVAdapter {
  /** Source this adapter belongs to, used to filter by the Torznab apikey. */
  readonly source: ProviderSource;
  findBy(criteria: SearchCriteria): Promise<TorznabItemTV[]>;
}
