import { Container, bindingScopeValues } from "inversify";
import { config } from "./config.ts";
import { Token } from "../domain/Token.ts";
import { TMDB } from "../domain/clients/tmdb/TMDB.ts";
import { DonTorrentScrapper } from "../domain/providers/dontorrent/client/DonTorrentScrapper.ts";
import { DonTorrentWrapper } from "../domain/providers/dontorrent/DonTorrentWrapper.ts";
import { DonTorrentTVAdapter } from "../domain/providers/dontorrent/DonTorrentTVAdapter.ts";
import { DonTorrentMovieAdapter } from "../domain/providers/dontorrent/DonTorrentMovieAdapter.ts";
import { DonTorrentScrapperLocalCache } from "../domain/providers/dontorrent/client/DonTorrentScrapperLocalCache.ts";
import { MarcianoTorrentScrapper } from "../domain/providers/marcianotorent/client/MarcianoTorrentScrapper.ts";
import { MarcianoTorrentScrapperLocalCache } from "../domain/providers/marcianotorent/client/MarcianoTorrentScrapperLocalCache.ts";
import { MarcianoTorrentWrapper } from "../domain/providers/marcianotorent/MarcianoTorrentWrapper.ts";
import { MarcianoTorrentMovieAdapter } from "../domain/providers/marcianotorent/MarcianoTorrentMovieAdapter.ts";
import { RequestHandler } from "../domain/handlers/RequestHandler.ts";
import { LoggerPino } from "../domain/services/LoggerPino.ts";
import { TVMaze } from "../domain/clients/tvmaze/TVMaze.ts";

export const container = new Container({
  defaultScope: bindingScopeValues.Singleton,
});

// Clients
container.bind(Token.TMDB).toDynamicValue(TMDB.create);
container.bind(Token.TVMAZE).toDynamicValue(TVMaze.create);

// DonTorrent
if (config.ENABLE_DON_TORRENT) {
  container
    .bind(Token.DONTORRENT_SCRAPPER)
    .toConstantValue(
      new DonTorrentScrapperLocalCache(
        new DonTorrentScrapper(config.DON_TORRENT_BASE_URL, config.REQUEST_TIMEOUT_MS),
      ),
    );
  container
    .bind(Token.DONTORRENT_WRAPPER)
    .toDynamicValue(DonTorrentWrapper.create);
  container
    .bind(Token.DONTORRENT_TV_ADAPTER)
    .toDynamicValue(DonTorrentTVAdapter.create);
  container
    .bind(Token.MOVIE_ADAPTER)
    .toDynamicValue(DonTorrentMovieAdapter.create);
}

// MarcianoTorrent
if (config.ENABLE_MARCIANO_TORRENT) {
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
}

container.bind(Token.LOGGER).toDynamicValue(LoggerPino.create);

// Domain
container.bind(Token.REQUEST_HANDLER).toDynamicValue(RequestHandler.create);
