import type { CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import {
  isDonTorrentMediaType,
  parseDonTorrentMediaType,
} from "./models/DonTorrentMediaType.ts";
import { parseDonTorrentFormat } from "./models/DonTorrentFormat.ts";
import { DonTorrentSearchResult } from "./models/DonTorrentSearchResult.ts";
import type { DonTorrentShowSeasonMetadata } from "./models/DonTorrentShowSeasonMetadata.ts";
import { DonTorrentEpisodeMetadata } from "./models/DonTorrentEpisodeMetadata.ts";
import type { DonTorrentMovieMetadata } from "./models/DonTorrentMovieMetadata.ts";
import type {
  DonTorrentPageable,
  DonTorrentPageableMeta,
} from "./models/DonTorrentPageable.ts";
import type { DonTorrent } from "./DonTorrent.ts";
import {
  UndiciTorTransport,
  type DonTorrentOnionTransport,
} from "./DonTorrentOnionTransport.ts";

/**
 * DonTorrent scrapper that speaks to the Tor (.onion) service instead of the
 * SNI-blocked clearnet. It implements the same {@link DonTorrent} interface as
 * {@link DonTorrentScrapper} so the adapters are untouched, but the underlying
 * protocol differs in two ways:
 *
 * - Search is `GET /buscar/<query>` with a Referer header (the endpoint is
 *   hotlink-gated), not the clearnet `POST /buscar`.
 * - Downloads are direct `.torrent` links scraped from the detail page — the
 *   onion has no proof-of-work. There is therefore no content-id/table pair: the
 *   torrent path is carried in the `table` field and {@link contentToUrl} just
 *   turns it into an absolute onion URL.
 */
export class DonTorrentOnionScrapper implements DonTorrent {
  private readonly transport: DonTorrentOnionTransport;
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    torProxyUrl?: string,
    timeout = 30_000,
    transport?: DonTorrentOnionTransport,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.transport =
      transport ?? new UndiciTorTransport(this.baseUrl, torProxyUrl, timeout);
  }

  async search(
    query: string,
    page = 0,
  ): Promise<DonTorrentPageable<DonTorrentSearchResult>> {
    const encoded = encodeURIComponent(query);
    // Onion paginates through the URL: /buscar/<q> then /buscar/<q>/page/<n>.
    const path =
      page === 0 ? `/buscar/${encoded}` : `/buscar/${encoded}/page/${page + 1}`;

    const html = await this.transport.text(path, `${this.baseUrl}/`);
    const $ = cheerio.load(html);

    const items = this.extractSearchElements($);
    return {
      items,
      meta: this.extractPageableInfo($, items.length, page),
    };
  }

  private extractSearchElements($: CheerioAPI): DonTorrentSearchResult[] {
    return $("#buscador p a")
      .toArray()
      .flatMap((element) => {
        const $el = $(element);
        const href = $el.attr("href") ?? "";
        const badgeText = $el.closest("p").find(".badge").text().trim();

        // The onion mixes in categories we don't support (Juego, Música); their
        // badge is not a known media type — skip instead of throwing so a single
        // unsupported hit never sinks the whole search.
        if (!href || !isDonTorrentMediaType(badgeText)) {
          return [];
        }

        return [
          new DonTorrentSearchResult(
            href,
            $el.text().trim(),
            parseDonTorrentMediaType(badgeText),
          ),
        ];
      });
  }

  private extractPageableInfo(
    $: CheerioAPI,
    size: number,
    page: number,
  ): DonTorrentPageableMeta {
    if (size === 0) {
      return { page, size, hasNext: false };
    }

    const lastPageItem = $("nav.page-navigator li:last-child");
    const hasNext =
      lastPageItem.length > 0 && !lastPageItem.hasClass("disabled");

    return { page, size, hasNext };
  }

  async getMovieMetadata(path: string): Promise<DonTorrentMovieMetadata> {
    const $ = await this.loadDetail(path);

    const table = this.extractTorrentPath($);
    if (!table) {
      throw new Error(`No .torrent download link found on ${path}`);
    }

    const year = parseInt($("p:contains('Año:') a").first().text().trim(), 10);
    const format = parseDonTorrentFormat(this.extractFormat($));

    return {
      contentId: 0,
      table,
      title: this.extractTitle($),
      year,
      format,
    };
  }

  async getShowSeasonMetadata(
    path: string,
  ): Promise<DonTorrentShowSeasonMetadata> {
    const $ = await this.loadDetail(path);

    const format = parseDonTorrentFormat(this.extractFormat($));

    const episodes = $("table tr")
      .toArray()
      .flatMap((row) => {
        const $cells = $(row).find("td");
        if ($cells.length === 0) {
          return []; // header row (only <th>)
        }

        const table = $cells.find("a[download]").attr("href") ?? "";
        if (!table) {
          return [];
        }

        return [
          new DonTorrentEpisodeMetadata({
            contentId: 0,
            table,
            title: $cells.eq(0).text().trim(),
            date: $cells.eq(2).text().trim(),
          }),
        ];
      });

    return { name: this.extractTitle($), format, episodes };
  }

  async contentToUrl(_contentId: number, table: string): Promise<string> {
    // `table` carries the scraped `/torrents/....torrent` path; there is no
    // proof-of-work on the onion, so the download URL is just the absolute path.
    return this.baseUrl + table;
  }

  async download(url: string): Promise<Buffer> {
    return this.transport.bytes(url);
  }

  private loadDetail(path: string): Promise<CheerioAPI> {
    return this.transport
      .text(path, `${this.baseUrl}/`)
      .then((html) => cheerio.load(html));
  }

  private extractTorrentPath($: CheerioAPI): string {
    return $("a[download]").first().attr("href") ?? "";
  }

  private extractFormat($: CheerioAPI): string {
    return $("p:contains('Formato:')")
      .first()
      .text()
      .replace(/.*Formato:\s*/i, "")
      .trim();
  }

  private extractTitle($: CheerioAPI): string {
    // Detail heading is "Descargar <name> por Torrent"; downstream only uses the
    // search query for titles, so this is best-effort metadata.
    const raw = $(".descargarTitulo").first().text().trim();
    return raw
      .replace(/^Descargar\s+/i, "")
      .replace(/\s+por Torrent\.?$/i, "")
      .trim();
  }
}
