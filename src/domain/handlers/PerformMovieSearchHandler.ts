import {
  isMovieSearchByTMDB,
  type MovieSearchRequest,
} from "../schemas/MovieSearchRequestSchema.ts";
import type { TMDB } from "../clients/tmdb/TMDB.ts";
import type { DonTorrentMovieAdapter } from "../providers/dontorrent/DonTorrentMovieAdapter.ts";
import { Token } from "../Token.ts";
import type { ResolutionContext } from "inversify";
import type { TorznabItemMovie } from "../models/TorznabItemMovie.ts";

export class PerformMovieSearchHandler {
  private readonly tmdb: TMDB;
  private readonly donTorrentAdapter: DonTorrentMovieAdapter;

  public static async create(context: ResolutionContext) {
    const [tmdb, donTorrentAdapter] = await Promise.all([
      context.getAsync<TMDB>(Token.TMDB),
      context.getAsync<DonTorrentMovieAdapter>(Token.DONTORRENT_MOVIE_ADAPTER),
    ]);
    return new PerformMovieSearchHandler(tmdb, donTorrentAdapter);
  }

  constructor(tmdb: TMDB, donTorrentAdapter: DonTorrentMovieAdapter) {
    this.tmdb = tmdb;
    this.donTorrentAdapter = donTorrentAdapter;
  }

  async handle(request: MovieSearchRequest): Promise<TorznabItemMovie[]> {
    if (isMovieSearchByTMDB(request)) {
      const movie = await this.tmdb.getMovie(request.tmdbid);
      return await this.donTorrentAdapter.findMovie(movie.title);
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
