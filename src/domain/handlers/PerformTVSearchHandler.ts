import type { ResolutionContext } from "inversify";
import { getTorznabRssXml } from "../mappers.ts";
import type { TVAdapter } from "../providers/TVAdapter.ts";
import type { TMDB } from "../clients/tmdb/TMDB.ts";
import { Token } from "../Token.ts";
import {
  type TVSearchRequest,
  isTVSearchByEpisode,
  isTVSearchBySeason,
  isTestRequest,
} from "../schemas/TVSearchRequestSchema.ts";
import type { TorznabItemTV } from "../models/TorznabItemTV.ts";
import type { TVMaze } from "../clients/tvmaze/TVMaze.ts";
import { getSpanishName } from "../clients/tvmaze/schemas/aka.ts";
import type { Logger } from "../services/Logger.ts";
import {
  SearchCriteriaEpisode,
  SearchCriteriaSeason,
  type SearchCriteria,
} from "../providers/SearchCriteria.ts";

export class PerformTVSearchHandler {
  private readonly tmdb: TMDB;
  private readonly tvmaze: TVMaze;
  private readonly tvAdapters: TVAdapter[];
  private readonly logger: Logger;

  private readonly MOCK_ITEM: TorznabItemTV = {
    type: "tv",
    title: "Breaking Bad S01E01 1080p",
    link: "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn=Example+File",
    size: 1234567890,
    category: 5040,
    pubDate: "Tue, 22 Jun 2010 06:54:22 +0100",
    season: 1,
    episode: 1,
  };

  public static async create(context: ResolutionContext) {
    const [tmdb, tvmaze, tvAdapters, logger] = await Promise.all([
      context.getAsync<TMDB>(Token.TMDB),
      context.getAsync<TVMaze>(Token.TVMAZE),
      context.getAllAsync<TVAdapter>(Token.TV_ADAPTER),
      context.getAsync<Logger>(Token.LOGGER),
    ]);
    return new PerformTVSearchHandler(tmdb, tvmaze, tvAdapters, logger);
  }

  constructor(
    tmdb: TMDB,
    tvmaze: TVMaze,
    tvAdapters: TVAdapter[],
    logger: Logger,
  ) {
    this.tmdb = tmdb;
    this.tvmaze = tvmaze;
    this.tvAdapters = tvAdapters;
    this.logger = logger;
  }

  async handle(request: TVSearchRequest): Promise<TorznabItemTV[]> {
    if (isTestRequest(request)) {
      return [this.MOCK_ITEM];
    }

    const name = await this.getShowSpanishName(request);

    this.logger.info(`Searching by: ${name}`);

    if (!name) {
      return [];
    }

    const criteria = this.buildCriteria(request, name);

    const results = await Promise.all(
      this.tvAdapters.map((adapter) =>
        adapter.findBy(criteria).catch((error) => {
          this.logger.error("TV adapter failed", { err: error });
          return [] as TorznabItemTV[];
        }),
      ),
    );

    return results.flat();
  }

  private buildCriteria(
    request: TVSearchRequest,
    name: string,
  ): SearchCriteria {
    if (isTVSearchByEpisode(request)) {
      return new SearchCriteriaEpisode(name, request.season, request.ep);
    }

    if (isTVSearchBySeason(request)) {
      return new SearchCriteriaSeason(name, request.season);
    }

    throw new Error("What?");
  }

  async getShowSpanishName(request: TVSearchRequest): Promise<string | null> {
    if (request.tmdbid) {
      const tvshow = await this.tmdb.getTvShow(request.tmdbid);
      return tvshow.name;
    }
    if (request.tvmazeid) {
      const show = await this.tvmaze.getShowById(request.tvmazeid);
      const akas = await this.tvmaze.getShowAKAs(show.id);
      return getSpanishName(akas) ?? show.name;
    }
    if (request.rid) {
      const show = await this.tvmaze.lookupByTvrageId(request.rid);
      const akas = await this.tvmaze.getShowAKAs(show.id);
      return getSpanishName(akas) ?? show.name;
    }
    if (request.imdbid) {
      const show = await this.tvmaze.lookupByImdbId(request.imdbid);
      const akas = await this.tvmaze.getShowAKAs(show.id);
      return getSpanishName(akas) ?? show.name;
    }
    if (request.tvdbid) {
      const show = await this.tvmaze.lookupByTvdbId(request.tvdbid);
      const akas = await this.tvmaze.getShowAKAs(show.id);
      return getSpanishName(akas) ?? show.name;
    }
    if (request.q) {
      const tvshow = await this.tmdb.searchTvShows(request.q);
      return tvshow.results.at(0)?.name ?? null;
    }

    return null;
  }
}
