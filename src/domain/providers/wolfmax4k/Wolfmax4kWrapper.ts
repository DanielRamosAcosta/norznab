import type { ResolutionContext } from "inversify";
import { Token } from "../../Token.ts";
import type { Wolfmax4k } from "./client/Wolfmax4k.ts";
import type { Wolfmax4kSearchResult } from "./client/models/Wolfmax4kSearchResult.ts";

export class Wolfmax4kWrapper {
  public static async create(context: ResolutionContext) {
    const scrapper = await context.getAsync<Wolfmax4k>(
      Token.WOLFMAX4K_SCRAPPER,
    );
    return new Wolfmax4kWrapper(scrapper);
  }

  private readonly scrapper: Wolfmax4k;

  // Safety cap so a broad query can't paginate unbounded.
  private static readonly MAX_PAGES = 10;

  constructor(scrapper: Wolfmax4k) {
    this.scrapper = scrapper;
  }

  async searchAll(query: string, page = 0): Promise<Wolfmax4kSearchResult[]> {
    const result = await this.scrapper.search(query, page);

    if (
      result.items.length === 0 ||
      !result.meta.hasNext ||
      page + 1 >= Wolfmax4kWrapper.MAX_PAGES
    ) {
      return result.items;
    }

    const nextItems = await this.searchAll(query, page + 1);
    return [...result.items, ...nextItems];
  }

  getTorrent(guid: string) {
    return this.scrapper.getTorrent(guid);
  }
}
