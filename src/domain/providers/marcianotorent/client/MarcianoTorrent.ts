import type { MarcianoTorrentPageable } from "./models/MarcianoTorrentPageable.ts";
import type { MarcianoTorrentSearchResult } from "./models/MarcianoTorrentSearchResult.ts";
import type { MarcianoTorrentMovieMetadata } from "./models/MarcianoTorrentMovieMetadata.ts";

export interface MarcianoTorrent {
  search(
    query: string,
    page?: number,
  ): Promise<MarcianoTorrentPageable<MarcianoTorrentSearchResult>>;
  getMovieMetadata(path: string): Promise<MarcianoTorrentMovieMetadata>;
  download(torrentPath: string): Promise<Buffer>;
}
