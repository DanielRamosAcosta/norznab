import type { DonTorrentSearchResult } from "./models/DonTorrentSearchResult.ts";
import type { DonTorrentShowSeasonMetadata } from "./models/DonTorrentShowSeasonMetadata.ts";
import type { DonTorrentMovieMetadata } from "./models/DonTorrentMovieMetadata.ts";
import type { DonTorrentPageable } from "./models/DonTorrentPageable.ts";

export interface DonTorrent {
  search(
    query: string,
    page?: number,
  ): Promise<DonTorrentPageable<DonTorrentSearchResult>>;
  getShowSeasonMetadata(path: string): Promise<DonTorrentShowSeasonMetadata>;
  getMovieMetadata(path: string): Promise<DonTorrentMovieMetadata>;
  contentToUrl(contentId: number, table: string): Promise<string>;
  download(url: string): Promise<Buffer>;
}
