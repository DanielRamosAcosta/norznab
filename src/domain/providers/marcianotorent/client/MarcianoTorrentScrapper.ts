import type { KyInstance } from "ky";
import ky from "ky";
import type { CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import type { MarcianoTorrent } from "./MarcianoTorrent.ts";
import type {
  MarcianoTorrentPageable,
  MarcianoTorrentPageableMeta,
} from "./models/MarcianoTorrentPageable.ts";
import { MarcianoTorrentSearchResult } from "./models/MarcianoTorrentSearchResult.ts";
import type { MarcianoTorrentMovieMetadata } from "./models/MarcianoTorrentMovieMetadata.ts";
import { parseMarcianoTorrentFormat } from "./models/MarcianoTorrentFormat.ts";

export class MarcianoTorrentScrapper implements MarcianoTorrent {
  private readonly client: KyInstance;
  private readonly baseUrl: string;

  constructor(baseUrl: string, timeout = 30_000) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.client = ky.create({
      prefixUrl: baseUrl,
      retry: 0,
      timeout,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  }

  async search(
    query: string,
    page = 0,
  ): Promise<MarcianoTorrentPageable<MarcianoTorrentSearchResult>> {
    const searchParams: Record<string, string> = { q: query };
    if (page > 0) {
      searchParams["page"] = (page + 1).toString(); // API is 1-indexed
    }

    const response = await this.client.get("busqueda", { searchParams });
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = this.extractSearchResults($);
    return {
      items,
      meta: this.extractPageableMeta($, items.length, page),
    };
  }

  private extractSearchResults($: CheerioAPI): MarcianoTorrentSearchResult[] {
    return $(".search-list > div[x-data]")
      .toArray()
      .map((el) => {
        const $el = $(el);
        const $a = $el.find("a").first();
        const href = $a.attr("href") ?? "";
        const quality = $a.find("div.media-info span").text().trim();
        const title =
          $a.find("img").attr("alt")?.replace(/\.$/, "").trim() ?? "";
        return new MarcianoTorrentSearchResult(title, quality, href);
      });
  }

  private extractPageableMeta(
    $: CheerioAPI,
    size: number,
    page: number,
  ): MarcianoTorrentPageableMeta {
    const hasNext =
      $('nav[aria-label="paginator"] a:contains("Siguiente")').length > 0;
    return { page, size, hasNext };
  }

  async getMovieMetadata(path: string): Promise<MarcianoTorrentMovieMetadata> {
    const response = await this.client.get(path.replace(/^\//, ""));
    const html = await response.text();
    const $ = cheerio.load(html);

    const h1Text = $("h1.text-white").text().trim();
    const title = h1Text.replace(/\s*\(\d{4}\)\s*$/, "").trim();
    const year = parseInt(
      $('a[href*="filtros/year/"] span').first().text().trim(),
    );
    const formatText = $('a[href*="filtros/quality/"] span')
      .first()
      .text()
      .trim();
    const format = parseMarcianoTorrentFormat(formatText);
    const torrentPath = $('a[href$=".torrent"]').attr("href") ?? "";

    return { title, year, format, torrentPath };
  }

  async download(torrentPath: string): Promise<Buffer> {
    const url = torrentPath.startsWith("/")
      ? `${this.baseUrl}${torrentPath}`
      : torrentPath;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
      },
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
