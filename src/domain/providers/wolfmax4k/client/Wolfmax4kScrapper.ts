import type { Wolfmax4k } from "./Wolfmax4k.ts";
import {
  QuicoHttp3Client,
  type Http3Client,
  type Http3RequestOptions,
} from "./Http3Client.ts";
import { EnlacitoResolver } from "./EnlacitoResolver.ts";
import {
  Wolfmax4kFindResponseSchema,
  isFindData,
} from "./models/Wolfmax4kFindResponse.ts";
import { Wolfmax4kSearchResult } from "./models/Wolfmax4kSearchResult.ts";
import type { Wolfmax4kPageable } from "./models/Wolfmax4kPageable.ts";

export class Wolfmax4kScrapper implements Wolfmax4k {
  private readonly hostname: string;
  private readonly http: Http3Client;
  private readonly enlacito: EnlacitoResolver;

  private static readonly PAGE_SIZE = 100;
  private static readonly USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  private token: string | null = null;

  constructor(
    baseUrl = "https://wolfmax4k.com",
    timeout = 30_000,
    http?: Http3Client,
    enlacito?: EnlacitoResolver,
  ) {
    this.hostname = new URL(baseUrl).hostname;
    this.http = http ?? new QuicoHttp3Client(timeout);
    this.enlacito = enlacito ?? new EnlacitoResolver();
  }

  async search(
    query: string,
    page = 0,
  ): Promise<Wolfmax4kPageable<Wolfmax4kSearchResult>> {
    const data = await this.performSearch(query, page);

    if (!isFindData(data)) {
      return { items: [], meta: { page, size: 0, hasNext: false } };
    }

    const group = Object.values(data.datafinds)[0] ?? {};
    const items = Object.values(group)
      // Entries without a name can't be classified nor rendered; skip them.
      .filter((item) => item.torrentName)
      .map(
        (item) =>
          new Wolfmax4kSearchResult(
            item.guid,
            item.calidad ?? "",
            item.torrentName ?? "",
            item.image ?? "",
          ),
      );

    const hasNext = (page + 1) * Wolfmax4kScrapper.PAGE_SIZE < data.pgcount;

    return { items, meta: { page, size: items.length, hasNext } };
  }

  private async performSearch(query: string, page: number) {
    const response = await this.postSearch(query, page, await this.getToken());
    const parsed = Wolfmax4kFindResponseSchema.parse(
      JSON.parse(response.body.toString("utf8")),
    );

    // A stale token / missing referer yields an error envelope; refresh once.
    if (!isFindData(parsed.data)) {
      this.token = null;
      const retry = await this.postSearch(query, page, await this.getToken());
      return Wolfmax4kFindResponseSchema.parse(
        JSON.parse(retry.body.toString("utf8")),
      ).data;
    }

    return parsed.data;
  }

  private async postSearch(query: string, page: number, token: string) {
    const boundary = `----norznab${Buffer.from(query).toString("hex")}${page}`;
    const body = this.buildMultipart(boundary, {
      token,
      cidr: "0",
      c: "0",
      q: query,
      l: String(Wolfmax4kScrapper.PAGE_SIZE),
      pg: String(page + 1), // API is 1-indexed
    });

    return this.request({
      hostname: this.hostname,
      path: "/mvc/controllers/data.find.php",
      method: "POST",
      headers: {
        referer: "https://wolfmax4k.com/",
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "content-length": Buffer.byteLength(body),
      },
      body,
    });
  }

  async getTorrent(guid: string): Promise<Buffer> {
    const sharerUrl = await this.getSharerUrl(guid);
    const torrentUrl = await this.enlacito.resolve(sharerUrl);
    return this.download(torrentUrl);
  }

  private async getSharerUrl(guid: string): Promise<string> {
    const response = await this.request({
      hostname: this.hostname,
      path: `/${guid}`,
      headers: { referer: "https://wolfmax4k.com/" },
    });

    const match = response.body
      .toString("utf8")
      .match(/enlacito\.com\/s\.php\?i=([A-Za-z0-9+/=]+)/);
    if (!match) {
      throw new Error(`No download link on detail page for ${guid}`);
    }

    return `https://enlacito.com/s.php?i=${match[1]}`;
  }

  private async download(url: string): Promise<Buffer> {
    const parsed = new URL(url);
    const response = await this.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: { referer: "https://wolfmax4k.com/" },
    });
    return response.body;
  }

  private async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    const response = await this.request({
      hostname: this.hostname,
      path: "/",
    });
    const token = response.body
      .toString("utf8")
      .match(/name="token" value="([a-f0-9]+)"/)?.[1];
    if (!token) {
      throw new Error("Could not read wolfmax4k CSRF token");
    }

    this.token = token;
    return token;
  }

  private request(options: Http3RequestOptions) {
    return this.http.send({
      ...options,
      headers: {
        "user-agent": Wolfmax4kScrapper.USER_AGENT,
        ...options.headers,
      },
    });
  }

  private buildMultipart(
    boundary: string,
    fields: Record<string, string>,
  ): string {
    const parts = Object.entries(fields).map(
      ([name, value]) =>
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
    );
    return parts.join("") + `--${boundary}--\r\n`;
  }
}
