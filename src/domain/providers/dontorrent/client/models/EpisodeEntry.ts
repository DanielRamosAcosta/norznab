import type { TorznabItemTV } from "../../../../models/TorznabItemTV.ts";
import {
  SearchCriteriaEpisode,
  SearchCriteriaSeason,
  type SearchCriteria,
} from "../../Criterias.ts";
import type { DonTorrentWrapper } from "../../DonTorrentWrapper.ts";
import { toTorznabFormat } from "../../toTorznabFormat.ts";
import type { DonTorrentFormat } from "./DonTorrentFormat.ts";
import parseTorrent, { toMagnetURI } from "parse-torrent";
import { SeasonEpisode } from "./SeasonEpisode.ts";
import { SeasonEpisodeRange } from "./SeasonEpisodeRange.ts";
import { SeasonRange } from "./SeasonRange.ts";
import { DonTorrentEpisodeMetadata } from "./DonTorrentEpisodeMetadata.ts";

export abstract class EpisodeEntry {
  readonly metadata: DonTorrentEpisodeMetadata;
  readonly format: DonTorrentFormat;

  public static parse(
    metadata: DonTorrentEpisodeMetadata,
    format: DonTorrentFormat,
  ) {
    // title: "1x01 - Piloto." -> concrete episode
    // title: "1x01 al 1x07." -> episode pack
    // title: "8×00 - (Especial: La Última Guardia)." -> special episode with × character

    // Try to match multi-season pack format: "Temporada 1-2 Completas"
    const multiSeasonMatch = metadata.title.match(
      /^Temporada\s+(\d+)-(\d+)\s+Completas/i,
    );
    if (multiSeasonMatch) {
      return new EpisodeEntrySeasonRange(
        metadata,
        format,
        parseInt(multiSeasonMatch[1], 10),
        parseInt(multiSeasonMatch[2], 10),
      );
    }

    // Try to match single complete season format: "Temporada 2 Completa (SUB ESP)"
    const singleSeasonMatch = metadata.title.match(
      /^Temporada\s+(\d+)\s+Completa/i,
    );
    if (singleSeasonMatch) {
      const season = parseInt(singleSeasonMatch[1], 10);
      return new EpisodeEntrySeasonRange(metadata, format, season, season);
    }

    // Try to match pack format: "1x01 al 1x07" (supports both x and × case insensitive)
    const packMatch = metadata.title.match(
      /^(\d)+[x×](\d+)\s+al\s+(\d+)[x×](\d+)/i,
    );
    if (packMatch) {
      return new EpisodeEntryEpisodeRange(
        metadata,
        format,
        {
          season: parseInt(packMatch[1], 10),
          episode: parseInt(packMatch[2], 10),
        },
        {
          season: parseInt(packMatch[3], 10),
          episode: parseInt(packMatch[4], 10),
        },
      );
    }

    // Try to match single episode format: "1x01" (supports both x and × case insensitive)
    const episodeMatch = metadata.title.match(/^(\d+)[x×](\d+)/i);
    if (episodeMatch) {
      return new EpisodeEntryEpisode(
        metadata,
        format,
        parseInt(episodeMatch[1], 10),
        parseInt(episodeMatch[2], 10),
      );
    }

    throw new Error(`Could not parse episode format from: ${metadata.title}`);
  }

  constructor(metadata: DonTorrentEpisodeMetadata, format: DonTorrentFormat) {
    this.metadata = metadata;
    this.format = format;
  }

  abstract matches(criteria: SearchCriteria): boolean;

  protected abstract formattedName(): string;

  protected abstract extraProperties(): Partial<TorznabItemTV>;

  async toTorznab(
    donTorrent: DonTorrentWrapper,
    showName: string,
  ): Promise<TorznabItemTV> {
    const url = await donTorrent.contentToUrl(
      this.metadata.contentId,
      this.metadata.table,
    );
    const buffer = await donTorrent.download(url);

    const parsed = await parseTorrent(buffer);
    const link = toMagnetURI(parsed);
    const size = "length" in parsed ? (parsed.length ?? 0) : 0;

    const format = toTorznabFormat(this.format);

    const pubDate = new Date(this.metadata.date).toUTCString();

    return {
      type: "tv",
      title: `${showName} ${this.formattedName()} ${format}`,
      link,
      pubDate,
      size,
      category: 5000,
      ...this.extraProperties(),
    };
  }
}

export class EpisodeEntrySeasonRange extends EpisodeEntry {
  readonly range: SeasonRange;

  constructor(
    metadata: DonTorrentEpisodeMetadata,
    format: DonTorrentFormat,
    seasonStart: number,
    seasonEnd: number,
  ) {
    super(metadata, format);
    this.range = SeasonRange.from(seasonStart, seasonEnd);
  }

  matches(criteria: SearchCriteria): boolean {
    if (criteria instanceof SearchCriteriaSeason) {
      return this.range.containsSeason(criteria.season);
    }

    return false;
  }

  protected formattedName() {
    return `${this.range}`;
  }

  protected extraProperties() {
    return {};
  }
}

export class EpisodeEntryEpisodeRange extends EpisodeEntry {
  readonly range: SeasonEpisodeRange;

  constructor(
    metadata: DonTorrentEpisodeMetadata,
    format: DonTorrentFormat,
    start: { season: number; episode: number },
    end: { season: number; episode: number },
  ) {
    super(metadata, format);
    this.range = SeasonEpisodeRange.from(start, end);
  }

  matches(criteria: SearchCriteria): boolean {
    if (criteria instanceof SearchCriteriaSeason) {
      return this.range.containsSeason(criteria.season);
    }

    return false;
  }

  protected formattedName() {
    return `${this.range}`;
  }

  protected extraProperties() {
    const uniqueSeason = this.range.getUniqueSeason();

    if (uniqueSeason) {
      return {
        season: uniqueSeason,
      };
    }

    return {};
  }
}

export class EpisodeEntryEpisode extends EpisodeEntry {
  readonly seasonEpisode: SeasonEpisode;

  constructor(
    metadata: DonTorrentEpisodeMetadata,
    format: DonTorrentFormat,
    season: number,
    episode: number,
  ) {
    super(metadata, format);
    this.seasonEpisode = SeasonEpisode.from(season, episode);
  }

  matches(criteria: SearchCriteria): boolean {
    if (criteria instanceof SearchCriteriaEpisode) {
      return (
        criteria.season === this.seasonEpisode.season.value &&
        criteria.episode === this.seasonEpisode.episode.value
      );
    }

    return false;
  }

  protected formattedName() {
    return `${this.seasonEpisode}`;
  }

  protected extraProperties() {
    return {
      season: this.seasonEpisode.season.value,
      episode: this.seasonEpisode.episode.value,
    };
  }
}
