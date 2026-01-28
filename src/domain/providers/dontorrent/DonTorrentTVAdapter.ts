import type { ResolutionContext } from "inversify";
import parseTorrent, { toMagnetURI } from "parse-torrent";
import type { TorznabItemTV } from "../../models/TorznabItemTV.ts";
import { filterEmpty } from "../../utils/filterNull.ts";
import type { DonTorrentWrapper } from "./DonTorrentWrapper.ts";
import {
  isTVShow,
  type DonTorrentSearchResult,
} from "./client/models/DonTorrentSearchResult.ts";
import type { DonTorrentEpisodeMetadata } from "./client/models/DonTorrentShowSeasonMetadata.ts";
import { Token } from "../../Token.ts";
import { toTorznabFormat } from "./toTorznabFormat.ts";

export class DonTorrentTVAdapter {
  private readonly donTorrent: DonTorrentWrapper;

  public static async create(context: ResolutionContext) {
    const wrapper = await context.getAsync<DonTorrentWrapper>(
      Token.DONTORRENT_WRAPPER,
    );
    return new DonTorrentTVAdapter(wrapper);
  }

  constructor(donTorrent: DonTorrentWrapper) {
    this.donTorrent = donTorrent;
  }

  async findTVShowEpisode(
    showName: string,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<TorznabItemTV[]> {
    const results = await this.donTorrent.searchAll(showName);

    const shows = results
      .filter(isTVShow)
      .map(this.parseSeasonNumber)
      .filter((s) => s.seasonNumber === seasonNumber);

    const episodes = await Promise.all(
      shows.map((r) => {
        return this.extractEpisode(showName, r, seasonNumber, episodeNumber);
      }),
    );

    return filterEmpty([episodes[0]]);
  }

  private parseSeasonNumber(tvShowResult: DonTorrentSearchResult) {
    const match = tvShowResult.name.match(/(\d+)ª Temporada/);
    if (!match) {
      throw new Error(
        `Could not parse season number from: ${tvShowResult.name}`,
      );
    }
    return {
      ...tvShowResult,
      seasonNumber: parseInt(match[1], 10),
    };
  }

  private async extractEpisode(
    showName: string,
    result: DonTorrentSearchResult,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<TorznabItemTV | null> {
    const showMetadata = await this.donTorrent.getShowSeasonMetadata(
      result.path,
    );

    const episodeMetadata = showMetadata.episodes
      .map(this.parseEpisodeNumber)
      .find((e) => e.number === episodeNumber);

    if (!episodeMetadata) {
      return null;
    }

    const url = await this.donTorrent.contentToUrl(
      episodeMetadata.contentId,
      episodeMetadata.table,
    );

    const buffer = await this.donTorrent.download(url);
    const parsed = await parseTorrent(buffer);
    const link = toMagnetURI(parsed);

    const torznabItemTV: TorznabItemTV = {
      type: "tv" as const,
      title: `${showName} ${this.formatSeasonEpisode(seasonNumber, episodeNumber)} ${toTorznabFormat(showMetadata.format)}`,
      link,
      pubDate: this.parseEpisodeDate(episodeMetadata),
      size: "length" in parsed ? (parsed.length ?? 0) : 0,
      category: 5000,
      season: seasonNumber,
      episode: episodeNumber,
    };

    return torznabItemTV;
  }

  private parseEpisodeNumber(episode: DonTorrentEpisodeMetadata) {
    const match = episode.title.match(/^\d+x(\d+)/);
    if (!match) {
      throw new Error(`Could not parse episode number from: ${episode.title}`);
    }
    return {
      ...episode,
      number: parseInt(match[1], 10),
    };
  }

  private parseEpisodeDate(episode: DonTorrentEpisodeMetadata) {
    const date = new Date(episode.date);
    return date.toUTCString();
  }

  private formatSeasonEpisode(season: number, episode: number) {
    return `S${season.toString().padStart(2, "0")}E${episode.toString().padStart(2, "0")}`;
  }
}
