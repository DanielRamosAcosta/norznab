import type { TorznabItemTV } from "../models/TorznabItemTV.ts";
import type { SearchCriteria } from "./SearchCriteria.ts";

/**
 * A TV provider adapter: given a season/episode search criteria it returns the
 * matching Torznab items. Implemented by every torrent source (DonTorrent,
 * wolfmax4k, ...) so the TV search handler can aggregate all of them.
 */
export interface TVAdapter {
  findBy(criteria: SearchCriteria): Promise<TorznabItemTV[]>;
}
