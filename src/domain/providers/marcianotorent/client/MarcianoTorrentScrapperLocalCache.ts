import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { MarcianoTorrent } from "./MarcianoTorrent.ts";
import { MarcianoTorrentSearchResult } from "./models/MarcianoTorrentSearchResult.ts";
import type { MarcianoTorrentPageable } from "./models/MarcianoTorrentPageable.ts";
import type { MarcianoTorrentMovieMetadata } from "./models/MarcianoTorrentMovieMetadata.ts";

type CacheData = Record<string, unknown>;

export class MarcianoTorrentScrapperLocalCache implements MarcianoTorrent {
  private cache: CacheData;

  private readonly delegate: MarcianoTorrent;
  private readonly cachePath = "./marcianotorent-data.json";

  constructor(delegate: MarcianoTorrent) {
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
  ): Promise<MarcianoTorrentPageable<MarcianoTorrentSearchResult>> {
    const key = this.getCacheKey("search", query, page);
    if (key in this.cache) {
      const cached = this.cache[
        key
      ] as MarcianoTorrentPageable<MarcianoTorrentSearchResult>;
      return {
        ...cached,
        items: cached.items.map(
          (r) => new MarcianoTorrentSearchResult(r.title, r.quality, r.href),
        ),
      };
    }
    const result = await this.delegate.search(query, page);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async getMovieMetadata(path: string): Promise<MarcianoTorrentMovieMetadata> {
    const key = this.getCacheKey("getMovieMetadata", path);
    if (key in this.cache) {
      return this.cache[key] as MarcianoTorrentMovieMetadata;
    }
    const result = await this.delegate.getMovieMetadata(path);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async download(torrentPath: string): Promise<Buffer> {
    const key = this.getCacheKey("download", torrentPath);
    if (key in this.cache) {
      return Buffer.from(this.cache[key] as string, "hex");
    }
    const result = await this.delegate.download(torrentPath);
    this.cache[key] = result.toString("hex");
    this.saveCache();
    return result;
  }
}
