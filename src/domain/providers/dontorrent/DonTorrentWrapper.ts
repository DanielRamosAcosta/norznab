import type { ResolutionContext } from "inversify";
import { Token } from "../../Token.ts";
import type { DonTorrent } from "./client/DonTorrent.ts";

export class DonTorrentWrapper {
  public static async create(context: ResolutionContext) {
    const scrapper = await context.getAsync<DonTorrent>(
      Token.DONTORRENT_SCRAPPER,
    );
    return new DonTorrentWrapper(scrapper);
  }

  private readonly scrapper: DonTorrent;

  constructor(scrapper: DonTorrent) {
    this.scrapper = scrapper;
  }

  search(query: string, page = 0) {
    return this.scrapper.search(query, page);
  }

  async searchAll(query: string, page = 0): Promise<typeof result.items> {
    const result = await this.scrapper.search(query, page);

    if (result.items.length === 0 || !result.meta.hasNext) {
      return result.items;
    }

    const nextItems = await this.searchAll(query, page + 1);
    return [...result.items, ...nextItems];
  }

  getShowMetadata(path: string) {
    return this.scrapper.getShowSeasonMetadata(path);
  }

  getMovieMetadata(path: string) {
    return this.scrapper.getMovieMetadata(path);
  }

  contentToUrl(contentId: number, table: string) {
    return this.scrapper.contentToUrl(contentId, table);
  }

  download(url: string) {
    return this.scrapper.download(url);
  }
}
