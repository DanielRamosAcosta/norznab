import type { KyInstance } from "ky";
import ky from "ky";
import type { CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import { parseDonTorrentMediaType } from "./models/DonTorrentMediaType.ts";
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
import type { TorFetch } from "./DonTorrentTorFetch.ts";
import type { DonTorrentDomainResolver } from "./DonTorrentDomainResolver.ts";
import type { Logger } from "../../../services/Logger.ts";
import { LoggerNoop } from "../../../services/LoggerNoop.ts";

export interface DonTorrentScrapperOptions {
  fetch?: TorFetch;
  logger?: Logger;
  resolver?: DonTorrentDomainResolver;
}

export class DonTorrentScrapper implements DonTorrent {
  public static create() {
    return new DonTorrentScrapper();
  }

  private client: KyInstance;
  private readonly fetchImpl: TorFetch;
  private readonly logger: Logger;
  private readonly resolver?: DonTorrentDomainResolver;
  private baseUrl: string;

  private static readonly PAGE_SIZE = 30;

  constructor(
    baseUrl = "https://dontorrent.management",
    timeout = 30_000,
    options: DonTorrentScrapperOptions = {},
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.logger = (options.logger ?? new LoggerNoop()).forClass(
      DonTorrentScrapper.name,
    );
    this.resolver = options.resolver;
    this.fetchImpl = this.withDomainObservation(options.fetch ?? fetch);
    this.client = ky.create({
      retry: 0,
      timeout,
      fetch: this.fetchImpl,
    });
  }

  // Authoritative domain from privtr.ee (cached with TTL inside the resolver);
  // falls back to the current baseUrl (seed, or the last value learned via
  // observeDomain) when there is no resolver or it fails.
  private async getBaseUrl(): Promise<string> {
    if (!this.resolver) {
      return this.baseUrl;
    }
    try {
      return await this.resolver.resolve();
    } catch (error) {
      this.logger.warn(
        "Failed to resolve DonTorrent domain from privtr.ee, using fallback",
        { err: error, baseUrl: this.baseUrl },
      );
      return this.baseUrl;
    }
  }

  private withDomainObservation(inner: TorFetch): TorFetch {
    return async (input, init) => {
      const response = await inner(input, init);
      this.observeDomain(response.url);
      return response;
    };
  }

  private async url(pathOrName: string): Promise<string> {
    return new URL(pathOrName, `${await this.getBaseUrl()}/`).href;
  }

  private observeDomain(responseUrl: string): void {
    if (!responseUrl) {
      return;
    }
    let origin: string;
    try {
      origin = new URL(responseUrl).origin;
    } catch {
      return;
    }
    if (origin !== this.baseUrl) {
      this.logger.warn("DonTorrent domain changed", {
        from: this.baseUrl,
        to: origin,
      });
      this.baseUrl = origin;
    }
  }

  async search(
    query: string,
    page = 0,
  ): Promise<DonTorrentPageable<DonTorrentSearchResult>> {
    const form = new URLSearchParams();
    form.append("valor", query);
    form.append("Buscar", "Buscar");
    form.append("p", (page + 1).toString()); // API is 1-indexed

    const response = await this.client.post(await this.url("buscar"), {
      body: form,
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const items = this.extractSearchElements($);
    return {
      items,
      meta: this.extractPagableInfo($, items.length, page),
    };
  }

  private extractPagableInfo(
    $: CheerioAPI,
    size: number,
    page: number,
  ): DonTorrentPageableMeta {
    if (size === 0) {
      return { page, size, hasNext: false };
    }

    const lastPageItem = $("nav.page-navigator li:last-child");
    const hasNext = !lastPageItem.hasClass("disabled");

    return {
      page,
      size,
      hasNext,
    };
  }

  private extractSearchElements($: CheerioAPI) {
    return $("#buscador li.search-result")
      .toArray()
      .map((element) => {
        const $el = $(element);
        const $link = $el.find("a.search-result-link");
        const $badge = $el.find(".badge");
        const name = $link.text().trim().replace(/\.$/, "");

        const result = new DonTorrentSearchResult(
          $link.attr("href") || "",
          name,
          parseDonTorrentMediaType($badge.text().trim()),
        );

        return result;
      });
  }

  async getShowSeasonMetadata(
    path: string,
  ): Promise<DonTorrentShowSeasonMetadata> {
    const response = await this.client.get(await this.url(path));
    const html = await response.text();
    const $ = cheerio.load(html);

    const name = $("h2.descargarTitulo").text().trim();
    const formatText = $("p:contains('Formato:')")
      .text()
      .replace("Formato:", "")
      .trim();
    const format = parseDonTorrentFormat(formatText);

    const episodes = $("table tbody tr")
      .toArray()
      .map((row) => {
        const $row = $(row);
        const $cells = $row.find("td");
        const title = $cells.eq(0).text().trim();
        const $downloadBtn = $cells.eq(1).find("[data-content-id]");
        const contentId = parseInt($downloadBtn.data("content-id") as string);
        const table = $downloadBtn.data("tabla") as string;
        const date = $cells.eq(2).text().trim();
        return new DonTorrentEpisodeMetadata({
          contentId,
          table,
          title,
          date,
        });
      });

    return { name, format, episodes };
  }

  async getMovieMetadata(path: string): Promise<DonTorrentMovieMetadata> {
    const response = await this.client.get(await this.url(path));
    const html = await response.text();
    const $ = cheerio.load(html);
    const downloadButton = $("[data-content-id]").first();
    const contentId = parseInt(downloadButton.data("content-id") as string);
    const table = downloadButton.data("tabla") as string;
    const title = $("h1").text().trim();
    const year = parseInt($("p:contains('Año:') a").text().trim());
    const formatText = $("p:contains('Formato:')")
      .text()
      .replace(/.*Formato:\s*/i, "")
      .trim();
    const format = parseDonTorrentFormat(formatText);

    return {
      contentId,
      table,
      title,
      year,
      format,
    };
  }

  async contentToUrl(contentId: number, table: string) {
    const challenge = await this.generateChallenge(contentId, table);
    const nonce = await this.computeProofOfWork(challenge, 3);
    const downloadPath = await this.validateChallenge(challenge, nonce);
    return "http:" + downloadPath;
  }

  private async generateChallenge(
    contentId: number,
    table: string,
  ): Promise<string> {
    const generateResponse = await this.client.post(
      await this.url("api_validate_pow.php"),
      {
        json: {
          action: "generate",
          content_id: contentId,
          tabla: table,
        },
      },
    );

    const generateResult = await generateResponse.json<{
      success: boolean;
      challenge: string;
      error?: string;
    }>();

    if (!generateResult.success) {
      throw new Error(generateResult.error || "Error generando challenge");
    }

    return generateResult.challenge;
  }

  private async validateChallenge(challenge: string, nonce: number) {
    const response = await this.client.post(
      await this.url("api_validate_pow.php"),
      {
        json: {
          action: "validate",
          challenge: challenge,
          nonce: nonce,
        },
      },
    );

    const data = await response.json<{
      success: boolean;
      download_url?: string;
      status?: string;
      error?: string;
      captcha_image?: string;
      message?: string;
      wait_minutes?: number;
    }>();

    if (!data.success) {
      throw new Error("Error performing pow validation: " + data.status);
    }

    return data.download_url as string;
  }

  private async sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    return await crypto.subtle.digest("SHA-256", msgBuffer);
  }

  private async computeProofOfWork(challenge: string, difficulty = 3) {
    let nonce = 0;
    const target = "0".repeat(difficulty);

    while (true) {
      const text = challenge + nonce;
      const hashBuffer = await this.sha256(text);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (hashHex.startsWith(target)) {
        return nonce;
      }
      nonce++;
    }
  }

  async download(url: string) {
    const response = await this.fetchImpl(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
