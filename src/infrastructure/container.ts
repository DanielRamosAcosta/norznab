import { Container, bindingScopeValues } from "inversify";
import { config } from "./config.ts";
import { Token } from "../domain/Token.ts";
import { TMDB } from "../domain/clients/tmdb/TMDB.ts";
import { DonTorrentScrapper } from "../domain/providers/dontorrent/client/DonTorrentScrapper.ts";
import { DonTorrentWrapper } from "../domain/providers/dontorrent/DonTorrentWrapper.ts";
import { DonTorrentTVAdapter } from "../domain/providers/dontorrent/DonTorrentTVAdapter.ts";
import { DonTorrentMovieAdapter } from "../domain/providers/dontorrent/DonTorrentMovieAdapter.ts";
import { DonTorrentScrapperLocalCache } from "../domain/providers/dontorrent/client/DonTorrentScrapperLocalCache.ts";
import { EliteTorrentScrapper } from "../domain/providers/elitetorrent/client/EliteTorrentScrapper.ts";
import { EliteTorrentMovieAdapter } from "../domain/providers/elitetorrent/EliteTorrentMovieAdapter.ts";
import { RequestHandler } from "../domain/handlers/RequestHandler.ts";
import { LoggerPino } from "../domain/services/LoggerPino.ts";
import type { Logger } from "../domain/services/Logger.ts";
import { TVMaze } from "../domain/clients/tvmaze/TVMaze.ts";

export const container = new Container({
  defaultScope: bindingScopeValues.Singleton,
});

// Clients
container.bind(Token.TMDB).toDynamicValue(TMDB.create);
container.bind(Token.TVMAZE).toDynamicValue(TVMaze.create);

// DonTorrent (plain fetch; the domain is learned from 301s via observeDomain)
container.bind(Token.DONTORRENT_SCRAPPER).toDynamicValue(async (context) => {
  const logger = await context.getAsync<Logger>(Token.LOGGER);
  const { DON_TORRENT_BASE_URL: base, REQUEST_TIMEOUT_MS: timeout } = config;
  return new DonTorrentScrapperLocalCache(
    new DonTorrentScrapper(base, timeout, { logger }),
  );
});
container
  .bind(Token.DONTORRENT_WRAPPER)
  .toDynamicValue(DonTorrentWrapper.create);
container.bind(Token.TV_ADAPTER).toDynamicValue(DonTorrentTVAdapter.create);
container
  .bind(Token.MOVIE_ADAPTER)
  .toDynamicValue(DonTorrentMovieAdapter.create);

// EliteTorrent (reached over HTTP/3 because it is SNI-blocked on TCP)
container.bind(Token.ELITETORRENT_SCRAPPER).toDynamicValue(async (context) => {
  const logger = await context.getAsync<Logger>(Token.LOGGER);
  return new EliteTorrentScrapper(
    config.ELITE_TORRENT_BASE_URL,
    config.ELITE_TORRENT_HTTP_TIMEOUT_MS,
    undefined,
    logger,
  );
});
container
  .bind(Token.MOVIE_ADAPTER)
  .toDynamicValue(EliteTorrentMovieAdapter.create);

container.bind(Token.LOGGER).toDynamicValue(LoggerPino.create);

// Domain
container.bind(Token.REQUEST_HANDLER).toDynamicValue(RequestHandler.create);
