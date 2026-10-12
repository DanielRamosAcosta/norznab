import type { CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import { QuicoHttp3Client, type Http3Client } from "../../http3/Http3Client.ts";
import type { Logger } from "../../../services/Logger.ts";
import { LoggerNoop } from "../../../services/LoggerNoop.ts";
import { decodeEliteLink } from "./decodeEliteLink.ts";
import type {
  EliteTorrent,
  EliteTorrentRelease,
  EliteTorrentSearchResult,
} from "./EliteTorrent.ts";

/**
 * Scrapes EliteTorrent over HTTP/3.
 *
 * Like wolfmax4k, EliteTorrent is SNI-blocked on TCP (a plain `fetch` is reset
 * with ECONNRESET) but reachable over QUIC, so it shares the HTTP/3 transport.
 * Downloads are hidden behind an `acortame-esto.com` ad-gate, but the token is a
 * purely client-side obfuscation of the real magnet/torrent (see
 * {@link decodeEliteLink}), so the ad-gate is bypassed by decoding locally.
 */
export class EliteTorrentScrapper implements EliteTorrent {
  private readonly http: Http3Client;
  private readonly hostname: string;
  private readonly baseUrl: string;
  private readonly logger: Logger;

  constructor(
    baseUrl = "https://www.elitetorrent.com",
    timeout = 15_000,
    http?: Http3Client,
    logger: Logger = new LoggerNoop(),
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.hostname = new URL(this.baseUrl).hostname;
    this.logger = logger;
    this.http = http ?? new QuicoHttp3Client(timeout, logger);
  }

  async search(query: string): Promise<EliteTorrentSearchResult[]> {
    const html = await this.get(`/?s=${encodeURIComponent(query)}`);
    const $ = cheerio.load(html);

    const seen = new Set<string>();
    const results: EliteTorrentSearchResult[] = [];
    // Each hit renders a poster anchor inside `.imagen`; the sibling `.meta`
    // anchor is a truncated duplicate, so key off the poster and dedupe by path.
    $(".imagen a[href*='/peliculas/'], .imagen a[href*='/serie/']").each(
      (_, el) => {
        const $el = $(el);
        const path = this.toPath($el.attr("href"));
        const title = ($el.attr("title") ?? "").trim();
        if (!path || !title || seen.has(path)) return;
        seen.add(path);
        results.push({ path, title });
      },
    );

    return results;
  }

  async getRelease(path: string): Promise<EliteTorrentRelease | null> {
    const html = await this.get(path);
    const $ = cheerio.load(html);

    const magnet = this.extractMagnet($);
    if (!magnet) {
      return null;
    }

    return {
      name: this.releaseNameFromMagnet(magnet),
      magnet,
      size: this.extractSize($),
      pubDate: this.extractPubDate($),
      quality: this.extractQuality($),
      format: this.extractLabel($, "Formato"),
      language: this.extractLanguage($),
      year: this.extractYear($),
    };
  }

  private extractMagnet($: CheerioAPI): string | null {
    for (const el of $("a.enlace_torrent").toArray()) {
      const token = this.tokenFromHref($(el).attr("href"));
      if (!token) continue;
      const decoded = decodeEliteLink(token).replace(/&amp;/g, "&");
      if (decoded.startsWith("magnet:")) {
        return decoded;
      }
    }
    return null;
  }

  private releaseNameFromMagnet(magnet: string): string {
    const match = magnet.match(/[?&]dn=([^&]+)/);
    const dn = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
    // Drop the site tag the tracker appends, e.g. " (EliteTorrent.net)".
    return dn.replace(/\s*\(EliteTorrent\.net\)\s*$/i, "").trim();
  }

  private extractSize($: CheerioAPI): number {
    // The value sits in a sibling text node ("Tamaño: 2 GBs"), so scan the page
    // text rather than a single element.
    const match = $.root()
      .text()
      .match(/Tama[nñ]o:?\s*([0-9.,]+)\s*([GMK])B/i);
    if (!match) return 0;
    const value = parseFloat(match[1].replace(",", "."));
    const unit = match[2].toUpperCase();
    const factor = unit === "G" ? 1024 ** 3 : unit === "M" ? 1024 ** 2 : 1024;
    return Math.round(value * factor);
  }

  private extractPubDate($: CheerioAPI): string {
    const date = this.extractDateParts($);
    if (!date) return new Date(0).toUTCString();
    const { yyyy, mm, dd } = date;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`).toUTCString();
  }

  private extractYear($: CheerioAPI): number | null {
    const year = this.extractDateParts($)?.yyyy;
    return year ? parseInt(year, 10) : null;
  }

  /**
   * Reads the `Fecha:` value, which comes in two shapes across the site:
   * `DD-MM-YYYY` on torrent detail pages and `YYYY-MM-DD` on film sheets.
   */
  private extractDateParts(
    $: CheerioAPI,
  ): { yyyy: string; mm: string; dd: string } | null {
    const text = $.root().text();
    const dmy = text.match(/Fecha:?\s*(\d{2})-(\d{2})-(\d{4})/);
    if (dmy) return { dd: dmy[1], mm: dmy[2], yyyy: dmy[3] };
    const ymd = text.match(/Fecha:?\s*(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return { yyyy: ymd[1], mm: ymd[2], dd: ymd[3] };
    return null;
  }

  // A value that an *arr parser reads as a real video quality (resolution or
  // known source), used to tell `Calidad: 720p` from a `Calidad: 9.1` rating.
  private static readonly VIDEO_QUALITY =
    /^(2160p|1080p|720p|480p|4k|uhd|bluray|bdremux|bdrip|brrip|webrip|web-?dl|hdrip|hdtv|dvdrip|microhd|cam|ts|screener|remux)/i;

  /**
   * Reads the video `Calidad:` from the detail page. The sheet can also carry a
   * numeric `Calidad:` rating (e.g. `9.1`), so scan every occurrence and keep
   * the first that looks like an actual video quality.
   */
  private extractQuality($: CheerioAPI): string {
    const text = $.root().text();
    for (const match of text.matchAll(/Calidad:\s*([A-Za-z0-9.+-]+)/gi)) {
      const value = match[1].trim();
      if (EliteTorrentScrapper.VIDEO_QUALITY.test(value)) return value;
    }
    return "";
  }

  /**
   * Reads a single-word technical field (`Formato: MP4`) from the detail-page
   * text. Values are single tokens, so stop at the first space.
   */
  private extractLabel($: CheerioAPI, label: string): string {
    const match = $.root()
      .text()
      .match(new RegExp(`${label}:\\s*([A-Za-z0-9.+-]+)`, "i"));
    return match ? match[1].trim() : "";
  }

  /**
   * Reads `Idioma:` and maps it to a Torznab language token Radarr understands.
   * Spanish is the common case on this site; English is mapped too, anything
   * else is passed through so a profile can still match it.
   */
  private extractLanguage($: CheerioAPI): string {
    const match = $.root()
      .text()
      .match(/Idioma:\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+)/);
    const raw = match ? match[1].toLowerCase() : "";
    if (/espa|castellano|latino/.test(raw)) return "Spanish";
    if (/ingl|english/.test(raw)) return "English";
    return match ? match[1] : "";
  }

  private tokenFromHref(href: string | undefined): string | null {
    const match = href?.match(/[?&]i=([^&]+)/);
    return match ? match[1] : null;
  }

  private toPath(href: string | undefined): string {
    if (!href) return "";
    return href.replace(this.baseUrl, "").replace(/^https?:\/\/[^/]+/, "");
  }

  private async get(path: string): Promise<string> {
    this.logger.debug("elitetorrent GET", { path });
    const response = await this.http.send({
      hostname: this.hostname,
      path,
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    return response.body.toString("utf8");
  }
}
