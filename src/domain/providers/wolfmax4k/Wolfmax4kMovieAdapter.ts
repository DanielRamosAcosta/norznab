import type { ResolutionContext } from "inversify";
import parseTorrent, { toMagnetURI } from "parse-torrent";
import { Token } from "../../Token.ts";
import { filterEmpty } from "../../utils/filterNull.ts";
import type { MovieAdapter } from "../MovieAdapter.ts";
import type { TorznabItemMovie } from "../../models/TorznabItemMovie.ts";
import type { Wolfmax4kWrapper } from "./Wolfmax4kWrapper.ts";
import type { Wolfmax4kSearchResult } from "./client/models/Wolfmax4kSearchResult.ts";
import { toTorznabFormat } from "./toTorznabFormat.ts";
import type { Logger } from "../../services/Logger.ts";
import { LoggerNoop } from "../../services/LoggerNoop.ts";

export class Wolfmax4kMovieAdapter implements MovieAdapter {
  private readonly wolfmax4k: Wolfmax4kWrapper;
  private readonly logger: Logger;

  public static async create(context: ResolutionContext) {
    const [wrapper, logger] = await Promise.all([
      context.getAsync<Wolfmax4kWrapper>(Token.WOLFMAX4K_WRAPPER),
      context.getAsync<Logger>(Token.LOGGER),
    ]);
    return new Wolfmax4kMovieAdapter(wrapper, logger);
  }

  constructor(wolfmax4k: Wolfmax4kWrapper, logger: Logger = new LoggerNoop()) {
    this.wolfmax4k = wolfmax4k;
    this.logger = logger.forClass(Wolfmax4kMovieAdapter.name);
  }

  async findMovie(movieName: string): Promise<TorznabItemMovie[]> {
    const startedAt = Date.now();
    const results = await this.wolfmax4k.searchAll(movieName);
    const movies = results.filter((result) => result.isMovie());
    this.logger.debug("findMovie resolving editions", {
      movieName,
      editions: movies.length,
    });
    const items = await Promise.all(
      movies.map((movie) => this.extractMovie(movieName, movie)),
    );
    const resolved = filterEmpty(items);
    this.logger.debug("findMovie done", {
      movieName,
      editions: movies.length,
      resolved: resolved.length,
      ms: Date.now() - startedAt,
    });
    return resolved;
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
