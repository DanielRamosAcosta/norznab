import parseTorrent, { toMagnetURI } from "parse-torrent";
import type { ResolutionContext } from "inversify";
import { Token } from "../../Token.ts";
import type { MarcianoTorrentWrapper } from "./MarcianoTorrentWrapper.ts";
import type { MarcianoTorrentSearchResult } from "./client/models/MarcianoTorrentSearchResult.ts";
import type { TorznabItemMovie } from "../../models/TorznabItemMovie.ts";
import type { MovieAdapter } from "../MovieAdapter.ts";
import { toTorznabFormat } from "./toTorznabFormat.ts";

export class MarcianoTorrentMovieAdapter implements MovieAdapter {
  public static async create(context: ResolutionContext) {
    const wrapper = await context.getAsync<MarcianoTorrentWrapper>(
      Token.MARCIANOTORENT_WRAPPER,
    );
    return new MarcianoTorrentMovieAdapter(wrapper);
  }

  private readonly marcianoTorrent: MarcianoTorrentWrapper;

  constructor(marcianoTorrent: MarcianoTorrentWrapper) {
    this.marcianoTorrent = marcianoTorrent;
  }

  async findMovie(movieName: string): Promise<TorznabItemMovie[]> {
    const results = await this.marcianoTorrent.searchAll(movieName);
    const items = await Promise.all(
      results.map((r) => this.extractMovie(movieName, r)),
    );
    return items.filter((item): item is TorznabItemMovie => item !== null);
  }

  private async extractMovie(
    movieName: string,
    result: MarcianoTorrentSearchResult,
  ): Promise<TorznabItemMovie | null> {
    const path = new URL(result.href).pathname;
    const metadata = await this.marcianoTorrent.getMovieMetadata(path);
    const buffer = await this.marcianoTorrent.download(metadata.torrentPath);
    const parsed = await parseTorrent(buffer);
    const link = toMagnetURI(parsed);

    return {
      type: "movie",
      title: `${movieName} (${metadata.year}) ${toTorznabFormat(metadata.format)} - MarcianoTorrent`,
      link,
      size: "length" in parsed ? (parsed.length ?? 0) : 0,
      category: 2000,
      pubDate: (
        ("created" in parsed ? parsed.created : undefined) ?? new Date()
      ).toUTCString(),
    };
  }
}
