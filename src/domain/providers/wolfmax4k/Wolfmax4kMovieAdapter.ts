import type { ResolutionContext } from "inversify";
import parseTorrent, { toMagnetURI } from "parse-torrent";
import { Token } from "../../Token.ts";
import { filterEmpty } from "../../utils/filterNull.ts";
import type { MovieAdapter } from "../MovieAdapter.ts";
import type { TorznabItemMovie } from "../../models/TorznabItemMovie.ts";
import type { Wolfmax4kWrapper } from "./Wolfmax4kWrapper.ts";
import type { Wolfmax4kSearchResult } from "./client/models/Wolfmax4kSearchResult.ts";
import { toTorznabFormat } from "./toTorznabFormat.ts";

export class Wolfmax4kMovieAdapter implements MovieAdapter {
  private readonly wolfmax4k: Wolfmax4kWrapper;

  public static async create(context: ResolutionContext) {
    const wrapper = await context.getAsync<Wolfmax4kWrapper>(
      Token.WOLFMAX4K_WRAPPER,
    );
    return new Wolfmax4kMovieAdapter(wrapper);
  }

  constructor(wolfmax4k: Wolfmax4kWrapper) {
    this.wolfmax4k = wolfmax4k;
  }

  async findMovie(movieName: string): Promise<TorznabItemMovie[]> {
    const results = await this.wolfmax4k.searchAll(movieName);
    const movies = results.filter((result) => result.isMovie());
    const items = await Promise.all(
      movies.map((movie) => this.extractMovie(movieName, movie)),
    );
    return filterEmpty(items);
  }

  private async extractMovie(
    movieName: string,
    result: Wolfmax4kSearchResult,
  ): Promise<TorznabItemMovie | null> {
    try {
      const buffer = await this.wolfmax4k.getTorrent(result.guid);
      const parsed = await parseTorrent(buffer);
      const link = toMagnetURI(parsed);
      const format = toTorznabFormat(result.quality);
      const year = result.year;

      return {
        type: "movie",
        title: `${movieName}${year ? ` (${year})` : ""} ${format} - Wolfmax4k (${result.quality})`,
        link,
        size: "length" in parsed ? (parsed.length ?? 0) : 0,
        category: 2000,
        pubDate: (
          ("created" in parsed ? parsed.created : undefined) ?? new Date()
        ).toUTCString(),
      };
    } catch {
      return null;
    }
  }
}
