import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { DonTorrent } from "./DonTorrent.ts";
import type { DonTorrentSearchResult } from "./models/DonTorrentSearchResult.ts";
import type { DonTorrentShowSeasonMetadata } from "./models/DonTorrentShowSeasonMetadata.ts";
import type { DonTorrentMovieMetadata } from "./models/DonTorrentMovieMetadata.ts";
import type { DonTorrentPageable } from "./models/DonTorrentPageable.ts";

type CacheData = Record<string, unknown>;

export class DonTorrentScrapperLocalCache implements DonTorrent {
  private cache: CacheData;

  private readonly delegate: DonTorrent;
  private readonly cachePath = "./data.json";

  constructor(delegate: DonTorrent) {
    this.delegate = delegate;
    this.cache = this.loadCache();
  }

  private loadCache(): CacheData {
    if (!existsSync(this.cachePath)) {
      return {};
    }
    const content = readFileSync(this.cachePath, "utf-8");
    return JSON.parse(content) as CacheData;
  }

  private saveCache(): void {
    writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), "utf-8");
  }

  private getCacheKey(method: string, ...args: unknown[]): string {
    return `${method}:${JSON.stringify(args)}`;
  }

  async search(
    query: string,
    page = 0,
  ): Promise<DonTorrentPageable<DonTorrentSearchResult>> {
    const key = this.getCacheKey("search", query, page);
    if (key in this.cache) {
      return this.cache[key] as DonTorrentPageable<DonTorrentSearchResult>;
    }
    const result = await this.delegate.search(query, page);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async getShowSeasonMetadata(
    path: string,
  ): Promise<DonTorrentShowSeasonMetadata> {
    const key = this.getCacheKey("getShowSeasonMetadata", path);
    if (key in this.cache) {
      return this.cache[key] as DonTorrentShowSeasonMetadata;
    }
    const result = await this.delegate.getShowSeasonMetadata(path);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async getMovieMetadata(path: string): Promise<DonTorrentMovieMetadata> {
    const key = this.getCacheKey("getMovieMetadata", path);
    if (key in this.cache) {
      return this.cache[key] as DonTorrentMovieMetadata;
    }
    const result = await this.delegate.getMovieMetadata(path);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async contentToUrl(contentId: number, table: string) {
    const key = this.getCacheKey("contentToUrl", contentId, table);
    if (key in this.cache) {
      return this.cache[key] as string;
    }
    const result = await this.delegate.contentToUrl(contentId, table);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async download(url: string) {
    const key = this.getCacheKey("download", url);
    if (key in this.cache) {
      return Buffer.from(this.cache[key] as string, "hex");
    }
    const result = await this.delegate.download(url);
    this.cache[key] = result.toString("hex");
    this.saveCache();
    return result;
  }
}
