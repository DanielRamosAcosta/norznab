import { Container, bindingScopeValues } from "inversify";
import { Token } from "../domain/Token.ts";
import { TMDB } from "../domain/clients/tmdb/TMDB.ts";
import { DonTorrentScrapper } from "../domain/providers/dontorrent/client/DonTorrentScrapper.ts";
import { DonTorrentWrapper } from "../domain/providers/dontorrent/DonTorrentWrapper.ts";
import { DonTorrentTVAdapter } from "../domain/providers/dontorrent/DonTorrentTVAdapter.ts";
import { DonTorrentMovieAdapter } from "../domain/providers/dontorrent/DonTorrentMovieAdapter.ts";
import { RequestHandler } from "../domain/services/RequestHandler.ts";
import { DonTorrentScrapperLocalCache } from "../domain/providers/dontorrent/client/DonTorrentScrapperLocalCache.ts";

export const container = new Container({
  defaultScope: bindingScopeValues.Singleton,
});

// Clients
container.bind(Token.TMDB).toDynamicValue(TMDB.create);

// Providers
container
  .bind(Token.DONTORRENT_SCRAPPER)
  .toConstantValue(new DonTorrentScrapperLocalCache(new DonTorrentScrapper()));
container
  .bind(Token.DONTORRENT_WRAPPER)
  .toDynamicValue(DonTorrentWrapper.create);
container
  .bind(Token.DONTORRENT_TV_ADAPTER)
  .toDynamicValue(DonTorrentTVAdapter.create);
container
  .bind(Token.DONTORRENT_MOVIE_ADAPTER)
  .toDynamicValue(DonTorrentMovieAdapter.create);

// Domain
container.bind(Token.REQUEST_HANDLER).toDynamicValue(RequestHandler.create);
