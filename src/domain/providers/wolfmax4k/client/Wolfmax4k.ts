import type { Wolfmax4kPageable } from "./models/Wolfmax4kPageable.ts";
import type { Wolfmax4kSearchResult } from "./models/Wolfmax4kSearchResult.ts";

export interface Wolfmax4k {
  search(
    query: string,
    page?: number,
  ): Promise<Wolfmax4kPageable<Wolfmax4kSearchResult>>;

  /**
   * Resolves and downloads the `.torrent` file for a search result `guid`
   * (e.g. `movie/250811` or `serie-online/237445`).
   */
  getTorrent(guid: string): Promise<Buffer>;
}
