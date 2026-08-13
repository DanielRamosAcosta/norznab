import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { Wolfmax4k } from "./Wolfmax4k.ts";
import { Wolfmax4kSearchResult } from "./models/Wolfmax4kSearchResult.ts";
import type { Wolfmax4kPageable } from "./models/Wolfmax4kPageable.ts";

type CacheData = Record<string, unknown>;

/**
 * Persistent local cache decorator, mirroring the DonTorrent/Marciano caches.
 * Handy for development so repeated searches and downloads don't hammer the
 * source. Search results and downloaded torrents are cached separately.
 */
export class Wolfmax4kScrapperLocalCache implements Wolfmax4k {
  private cache: CacheData;

  private readonly delegate: Wolfmax4k;
  private readonly cachePath = "./wolfmax4k-data.json";

  constructor(delegate: Wolfmax4k) {
    this.delegate = delegate;
    this.cache = this.loadCache();
  }

  private loadCache(): CacheData {
    if (!existsSync(this.cachePath)) {
      return {};
    }
    return JSON.parse(readFileSync(this.cachePath, "utf-8")) as CacheData;
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
  ): Promise<Wolfmax4kPageable<Wolfmax4kSearchResult>> {
    const key = this.getCacheKey("search", query, page);
    if (key in this.cache) {
      const cached = this.cache[
        key
      ] as Wolfmax4kPageable<Wolfmax4kSearchResult>;
      return {
        ...cached,
        items: cached.items.map(
          (item) =>
            new Wolfmax4kSearchResult(
              item.guid,
              item.quality,
              item.torrentName,
              item.image,
            ),
        ),
      };
    }
    const result = await this.delegate.search(query, page);
    this.cache[key] = result;
    this.saveCache();
    return result;
  }

  async getTorrent(guid: string): Promise<Buffer> {
    const key = this.getCacheKey("getTorrent", guid);
    if (key in this.cache) {
      return Buffer.from(this.cache[key] as string, "hex");
    }
    const result = await this.delegate.getTorrent(guid);
    this.cache[key] = result.toString("hex");
    this.saveCache();
    return result;
  }
}
