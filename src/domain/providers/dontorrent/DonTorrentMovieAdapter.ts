import type { ResolutionContext } from "inversify";
import parseTorrent, { toMagnetURI } from "parse-torrent";
import { filterEmpty } from "../../utils/filterNull.ts";
import type { DonTorrentWrapper } from "./DonTorrentWrapper.ts";
import { DonTorrentSearchResult } from "./client/models/DonTorrentSearchResult.ts";
import { Token } from "../../Token.ts";
import type { TorznabItemMovie } from "../../models/TorznabItemMovie.ts";
import { toTorznabFormat } from "./toTorznabFormat.ts";
import type { MovieAdapter } from "../MovieAdapter.ts";

export class DonTorrentMovieAdapter implements MovieAdapter {
  private readonly donTorrent: DonTorrentWrapper;

  public static async create(context: ResolutionContext) {
    const wrapper = await context.getAsync<DonTorrentWrapper>(
      Token.DONTORRENT_WRAPPER,
    );
    return new DonTorrentMovieAdapter(wrapper);
  }

  constructor(donTorrent: DonTorrentWrapper) {
    this.donTorrent = donTorrent;
  }

  async findMovie(movieName: string): Promise<TorznabItemMovie[]> {
    const results = await this.donTorrent.searchAll(movieName);
    const movies = results.filter((r) => r.isMovie());
    const moviesAndMeta = await Promise.all(
      movies.map((m) => this.extractMovie(movieName, m)),
    );

    return filterEmpty(moviesAndMeta);
  }

  private async extractMovie(
    movieName: string,
    result: DonTorrentSearchResult,
  ): Promise<TorznabItemMovie | null> {
    // A single bad edition (e.g. an unmapped format) must not sink the whole
    // search — drop it and keep the other editions.
    try {
      const metadata = await this.donTorrent.getMovieMetadata(result.path);
      const url = await this.donTorrent.contentToUrl(
        metadata.contentId,
        metadata.table,
      );

      const buffer = await this.donTorrent.download(url);
      const parsed = await parseTorrent(buffer);
      const link = toMagnetURI(parsed);

      return {
        type: "movie",
        title: `${movieName} (${metadata.year}) ${toTorznabFormat(metadata.format)} - DonTorrent (${metadata.format})`,
        link: link,
        size: "length" in parsed ? (parsed.length ?? 0) : 0,
        category: 2000,
        pubDate: (
          ("created" in parsed ? parsed.created : undefined) ?? new Date()
        ).toUTCString(),
      };
    } catch {
      return null;
    }
  }
}
