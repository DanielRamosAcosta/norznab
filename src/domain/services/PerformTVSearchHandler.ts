import type { ResolutionContext } from "inversify";
import { readFileSync } from "node:fs";
import { getTorznabRssXml } from "../mappers.ts";
import type { DonTorrentTVAdapter } from "../providers/dontorrent/DonTorrentTVAdapter.ts";
import type { TMDB } from "../clients/tmdb/TMDB.ts";
import { Token } from "../Token.ts";
import {
  type TVSearchRequest,
  isTVSearchByTMDB,
} from "../schemas/TVSearchRequestSchema.ts";

export class PerformTVSearchHandler {
  private readonly tmdb: TMDB;
  private readonly donTorrentAdapter: DonTorrentTVAdapter;

  public static async create(context: ResolutionContext) {
    const [tmdb, donTorrentAdapter] = await Promise.all([
      context.getAsync<TMDB>(Token.TMDB),
      context.getAsync<DonTorrentTVAdapter>(Token.DONTORRENT_TV_ADAPTER),
    ]);
    return new PerformTVSearchHandler(tmdb, donTorrentAdapter);
  }

  constructor(tmdb: TMDB, donTorrentAdapter: DonTorrentTVAdapter) {
    this.tmdb = tmdb;
    this.donTorrentAdapter = donTorrentAdapter;
  }

  async handle(request: TVSearchRequest) {
    if (isTVSearchByTMDB(request)) {
      const tvshow = await this.tmdb.getTvShow(request.tmdbid);
      const results = await this.donTorrentAdapter.findTVShowEpisode(
        tvshow.name,
        request.season,
        request.ep,
      );
      return getTorznabRssXml(results);
    }

    // Generic searches return mock data for Sonarr indexer testing
    return getTorznabRssXml([
      {
        type: "tv",
        title: "Breaking Bad S01E01 1080p",
        link: readFileSync("./tests/example-magnet.url", "utf-8").trim(),
        size: 1234567890,
        category: 5040,
        pubDate: "Tue, 22 Jun 2010 06:54:22 +0100",
        season: 1,
        episode: 1,
      },
    ]);
  }
}
