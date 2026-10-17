import type { ResolutionContext } from "inversify";
import { Token } from "../../Token.ts";
import type { DonTorrent } from "./client/DonTorrent.ts";

// DonTorrent sits behind Cloudflare over a single Tor circuit, so hammering it
// with back-to-back page requests invites a 429. A small gap between pages and
// a depth cap keep the pagination from turning into a burst.
const PAGE_DELAY_MS = 500;
const MAX_PAGES = 20;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class DonTorrentWrapper {
  public static async create(context: ResolutionContext) {
    const scrapper = await context.getAsync<DonTorrent>(
      Token.DONTORRENT_SCRAPPER,
    );
    return new DonTorrentWrapper(scrapper);
  }

  private readonly scrapper: DonTorrent;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    scrapper: DonTorrent,
    sleep: (ms: number) => Promise<void> = defaultSleep,
  ) {
    this.scrapper = scrapper;
    this.sleep = sleep;
  }

  search(query: string, page = 0) {
    return this.scrapper.search(query, page);
  }

  async searchAll(query: string, page = 0): Promise<typeof result.items> {
    const result = await this.scrapper.search(query, page);

    const isLastPage = result.items.length === 0 || !result.meta.hasNext;
    if (isLastPage || page + 1 >= MAX_PAGES) {
      return result.items;
    }

    await this.sleep(PAGE_DELAY_MS);
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
