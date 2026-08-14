import { Container, bindingScopeValues } from "inversify";
import { config } from "./config.ts";
import { Token } from "../domain/Token.ts";
import { TMDB } from "../domain/clients/tmdb/TMDB.ts";
import { DonTorrentScrapper } from "../domain/providers/dontorrent/client/DonTorrentScrapper.ts";
import { DonTorrentOnionScrapper } from "../domain/providers/dontorrent/client/DonTorrentOnionScrapper.ts";
import { DonTorrentWrapper } from "../domain/providers/dontorrent/DonTorrentWrapper.ts";
import { DonTorrentTVAdapter } from "../domain/providers/dontorrent/DonTorrentTVAdapter.ts";
import { DonTorrentMovieAdapter } from "../domain/providers/dontorrent/DonTorrentMovieAdapter.ts";
import { DonTorrentScrapperLocalCache } from "../domain/providers/dontorrent/client/DonTorrentScrapperLocalCache.ts";
import { MarcianoTorrentScrapper } from "../domain/providers/marcianotorent/client/MarcianoTorrentScrapper.ts";
import { MarcianoTorrentScrapperLocalCache } from "../domain/providers/marcianotorent/client/MarcianoTorrentScrapperLocalCache.ts";
import { MarcianoTorrentWrapper } from "../domain/providers/marcianotorent/MarcianoTorrentWrapper.ts";
import { MarcianoTorrentMovieAdapter } from "../domain/providers/marcianotorent/MarcianoTorrentMovieAdapter.ts";
import { Wolfmax4kScrapper } from "../domain/providers/wolfmax4k/client/Wolfmax4kScrapper.ts";
import { Wolfmax4kScrapperLocalCache } from "../domain/providers/wolfmax4k/client/Wolfmax4kScrapperLocalCache.ts";
import { Wolfmax4kWrapper } from "../domain/providers/wolfmax4k/Wolfmax4kWrapper.ts";
import { Wolfmax4kMovieAdapter } from "../domain/providers/wolfmax4k/Wolfmax4kMovieAdapter.ts";
import { Wolfmax4kTVAdapter } from "../domain/providers/wolfmax4k/Wolfmax4kTVAdapter.ts";
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

// DonTorrent
// Clearnet is SNI-blocked from production; DON_TORRENT_USE_ONION swaps in the
// Tor (.onion) transport, keeping the same DonTorrent interface downstream.
const donTorrentScrapper = config.DON_TORRENT_USE_ONION
  ? new DonTorrentOnionScrapper(
      config.DON_TORRENT_ONION_URL,
      config.DON_TORRENT_TOR_PROXY || undefined,
      config.REQUEST_TIMEOUT_MS,
    )
  : new DonTorrentScrapper(
      config.DON_TORRENT_BASE_URL,
      config.REQUEST_TIMEOUT_MS,
    );
container
  .bind(Token.DONTORRENT_SCRAPPER)
  .toConstantValue(new DonTorrentScrapperLocalCache(donTorrentScrapper));
container
  .bind(Token.DONTORRENT_WRAPPER)
  .toDynamicValue(DonTorrentWrapper.create);
container.bind(Token.TV_ADAPTER).toDynamicValue(DonTorrentTVAdapter.create);
container
  .bind(Token.MOVIE_ADAPTER)
  .toDynamicValue(DonTorrentMovieAdapter.create);

// MarcianoTorrent
container
  .bind(Token.MARCIANOTORENT_SCRAPPER)
  .toConstantValue(
    new MarcianoTorrentScrapperLocalCache(
      new MarcianoTorrentScrapper(
        config.MARCIANO_TORRENT_BASE_URL,
        config.REQUEST_TIMEOUT_MS,
      ),
    ),
  );
container
  .bind(Token.MARCIANOTORENT_WRAPPER)
  .toDynamicValue(MarcianoTorrentWrapper.create);
container
  .bind(Token.MOVIE_ADAPTER)
  .toDynamicValue(MarcianoTorrentMovieAdapter.create);

// Wolfmax4k
container.bind(Token.WOLFMAX4K_SCRAPPER).toDynamicValue(async (context) => {
  const logger = await context.getAsync<Logger>(Token.LOGGER);
  return new Wolfmax4kScrapperLocalCache(
    new Wolfmax4kScrapper(
      config.WOLFMAX4K_BASE_URL,
      config.WOLFMAX4K_HTTP_TIMEOUT_MS,
      undefined,
      undefined,
      logger,
    ),
  );
});
container.bind(Token.WOLFMAX4K_WRAPPER).toDynamicValue(Wolfmax4kWrapper.create);
container
  .bind(Token.MOVIE_ADAPTER)
  .toDynamicValue(Wolfmax4kMovieAdapter.create);
container.bind(Token.TV_ADAPTER).toDynamicValue(Wolfmax4kTVAdapter.create);

// EliteTorrent (HTTP/3, like wolfmax)
container.bind(Token.ELITETORRENT_SCRAPPER).toDynamicValue(async (context) => {
  const logger = await context.getAsync<Logger>(Token.LOGGER);
  return new EliteTorrentScrapper(
    config.ELITE_TORRENT_BASE_URL,
    config.WOLFMAX4K_HTTP_TIMEOUT_MS,
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
