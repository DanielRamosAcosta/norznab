import type { ResolutionContext } from "inversify";
import type { MovieAdapter } from "../providers/MovieAdapter.ts";
import { selectBySource } from "../providers/selectBySource.ts";
import { Token } from "../Token.ts";
import type { TorznabItemMovie } from "../models/TorznabItemMovie.ts";
import type { Logger } from "../services/Logger.ts";
import {
  type SearchRequest,
  isSearchTestRequest,
} from "../schemas/SearchRequestSchema.ts";

export class PerformSearchHandler {
  private readonly movieAdapters: MovieAdapter[];
  private readonly logger: Logger;

  private readonly MOCK_ITEM: TorznabItemMovie = {
    type: "movie",
    title: "Interstellar 2014 1080p BluRay",
    link: "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Example+File",
    size: 2500000000,
    category: 2000,
    pubDate: "Fri, 07 Nov 2014 00:00:00 +0000",
    imdb: "tt0816692",
    imdbtitle: "Interstellar",
    imdbyear: "2014",
  };

  public static async create(context: ResolutionContext) {
    const [movieAdapters, logger] = await Promise.all([
      context.getAllAsync<MovieAdapter>(Token.MOVIE_ADAPTER),
      context.getAsync<Logger>(Token.LOGGER),
    ]);
    return new PerformSearchHandler(movieAdapters, logger);
  }

  constructor(movieAdapters: MovieAdapter[], logger: Logger) {
    this.movieAdapters = movieAdapters;
    this.logger = logger.forClass(PerformSearchHandler.name);
  }

  async handle(request: SearchRequest): Promise<TorznabItemMovie[]> {
    if (isSearchTestRequest(request)) {
      return [this.MOCK_ITEM];
    }

    const adapters = selectBySource(this.movieAdapters, request.apikey);
    const results = await Promise.all(
      adapters.map((adapter) =>
        adapter.findMovie(request.q!).catch((error) => {
          this.logger.error("Search adapter failed", { err: error });
          return [] as TorznabItemMovie[];
        }),
      ),
    );

    return results.flat();
  }
}
