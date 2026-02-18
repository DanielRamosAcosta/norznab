import type { DonTorrent } from "./DonTorrent.ts";
import type { DonTorrentSearchResult } from "./models/DonTorrentSearchResult.ts";
import type { DonTorrentShowSeasonMetadata } from "./models/DonTorrentShowSeasonMetadata.ts";
import type { DonTorrentMovieMetadata } from "./models/DonTorrentMovieMetadata.ts";
import type { DonTorrentPageable } from "./models/DonTorrentPageable.ts";

export class DonTorrentUnimplemented implements DonTorrent {
  search(
    _query: string,
    _page?: number,
  ): Promise<DonTorrentPageable<DonTorrentSearchResult>> {
    throw new Error("DonTorrent.search not implemented");
  }

  getShowSeasonMetadata(_path: string): Promise<DonTorrentShowSeasonMetadata> {
    throw new Error("DonTorrent.getShowSeasonMetadata not implemented");
  }

  getMovieMetadata(_path: string): Promise<DonTorrentMovieMetadata> {
    throw new Error("DonTorrent.getMovieMetadata not implemented");
  }

  contentToUrl(_contentId: number, _table: string): Promise<string> {
    throw new Error("DonTorrent.contentToUrl not implemented");
  }

  download(_url: string): Promise<Buffer> {
    throw new Error("DonTorrent.download not implemented");
  }
}
