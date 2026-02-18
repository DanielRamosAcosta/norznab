import type { ResolutionContext } from "inversify";
import { Token } from "../../Token.ts";
import type { MarcianoTorrent } from "./client/MarcianoTorrent.ts";
import type { MarcianoTorrentSearchResult } from "./client/models/MarcianoTorrentSearchResult.ts";

export class MarcianoTorrentWrapper {
  public static async create(context: ResolutionContext) {
    const scrapper = await context.getAsync<MarcianoTorrent>(
      Token.MARCIANOTORENT_SCRAPPER,
    );
    return new MarcianoTorrentWrapper(scrapper);
  }

  private readonly scrapper: MarcianoTorrent;

  constructor(scrapper: MarcianoTorrent) {
    this.scrapper = scrapper;
  }

  search(query: string, page = 0) {
    return this.scrapper.search(query, page);
  }

  async searchAll(
    query: string,
    page = 0,
  ): Promise<MarcianoTorrentSearchResult[]> {
    const result = await this.scrapper.search(query, page);

    if (!result.meta.hasNext) {
      return result.items;
    }

    const nextItems = await this.searchAll(query, page + 1);
    return [...result.items, ...nextItems];
  }

  getMovieMetadata(path: string) {
    return this.scrapper.getMovieMetadata(path);
  }

  download(torrentPath: string) {
    return this.scrapper.download(torrentPath);
  }
}
