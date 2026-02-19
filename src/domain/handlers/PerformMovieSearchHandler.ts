import {
  isMovieSearchByTMDB,
  type MovieSearchRequest,
} from "../schemas/MovieSearchRequestSchema.ts";
import type { TMDB } from "../clients/tmdb/TMDB.ts";
import type { MovieAdapter } from "../providers/MovieAdapter.ts";
import { Token } from "../Token.ts";
import type { ResolutionContext } from "inversify";
import type { TorznabItemMovie } from "../models/TorznabItemMovie.ts";
import type { Logger } from "../services/Logger.ts";

export class PerformMovieSearchHandler {
  private readonly tmdb: TMDB;
  private readonly movieAdapters: MovieAdapter[];
  private readonly logger: Logger;

  public static async create(context: ResolutionContext) {
    const [tmdb, movieAdapters, logger] = await Promise.all([
      context.getAsync<TMDB>(Token.TMDB),
      context.getAllAsync<MovieAdapter>(Token.MOVIE_ADAPTER),
      context.getAsync<Logger>(Token.LOGGER),
    ]);
    return new PerformMovieSearchHandler(tmdb, movieAdapters, logger);
  }

  constructor(tmdb: TMDB, movieAdapters: MovieAdapter[], logger: Logger) {
    this.tmdb = tmdb;
    this.movieAdapters = movieAdapters;
    this.logger = logger.forClass(PerformMovieSearchHandler.name);
  }

  private catchError(error: unknown): TorznabItemMovie[] {
    this.logger.error("Movie adapter failed", { err: error });
    return [];
  }

  async handle(request: MovieSearchRequest): Promise<TorznabItemMovie[]> {
    if (isMovieSearchByTMDB(request)) {
      const movie = await this.tmdb.getMovie(request.tmdbid);
      const results = await Promise.all(
        this.movieAdapters.map((adapter) =>
          adapter.findMovie(movie.title).catch(this.catchError.bind(this)),
        ),
      );
      return results.flat();
    }

    return [
      {
        type: "movie",
        title: "Interstellar 2014 1080p BluRay",
        link: "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Example+File",
        size: 2500000000,
        category: 2000,
        pubDate: "Fri, 07 Nov 2014 00:00:00 +0000",
        imdb: "tt0816692",
        imdbtitle: "Interstellar",
        imdbyear: "2014",
      },
    ];
  }
}
