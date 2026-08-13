export interface EpisodeMarker {
  season: number;
  episode: number;
}

export interface SeasonPackMarker {
  season: number;
  from: number;
  to: number;
}

// Opening bracket is usually `[` but the source occasionally typos a backtick.
const SINGLE_CAP = /[[`]cap\.\s*(\d+)\]/i;
const PACK_CAP = /[[`]cap\.\s*(\d+)_(\d+)\]/i;

function splitCode(code: string): { season: number; episode: number } {
  return {
    episode: parseInt(code.slice(-2), 10),
    season: parseInt(code.slice(0, -2) || "0", 10),
  };
}

/**
 * A single entry from the wolfmax4k `data.find.php` search endpoint.
 *
 * The `guid` looks like `movie/250811`, `online/269020`, `serie-online/237445`
 * or `serie-online-hd/237346`. The prefix is NOT a reliable movie/series
 * discriminator (movies also appear under `online/`), so classification is done
 * from the release name instead: series carry a `[Cap.SEE]` episode marker (or a
 * `[Cap.SEE_SEE]` season/episode-range pack), movies carry a `(YYYY)` year.
 */
export class Wolfmax4kSearchResult {
  readonly guid: string;
  readonly quality: string;
  readonly torrentName: string;
  readonly image: string;

  constructor(
    guid: string,
    quality: string,
    torrentName: string,
    image: string,
  ) {
    this.guid = guid;
    this.quality = quality;
    this.torrentName = torrentName;
    this.image = image;
  }

  /** Detail-page path, e.g. `/movie/250811`. */
  get detailPath(): string {
    return `/${this.guid}`;
  }

  /**
   * Parses a single-episode `[Cap.SEE]` marker into season/episode.
   *
   * The last two digits are the episode and the leading digits the season:
   * `Cap.309` -> S3E09, `Cap.407` -> S4E07, `Cap.1203` -> S12E03. Returns null
   * for movies and for season packs.
   */
  get episodeMarker(): EpisodeMarker | null {
    if (PACK_CAP.test(this.torrentName)) {
      return null;
    }
    const match = this.torrentName.match(SINGLE_CAP);
    return match ? splitCode(match[1]) : null;
  }

  /**
   * Parses a season/episode-range pack `[Cap.SEE_SEE]` (e.g. `Cap.501_512` ->
   * S5, episodes 1-12). Returns null when the release is not a pack.
   */
  get seasonPack(): SeasonPackMarker | null {
    const match = this.torrentName.match(PACK_CAP);
    if (!match) {
      return null;
    }
    const start = splitCode(match[1]);
    return {
      season: start.season,
      from: start.episode,
      to: splitCode(match[2]).episode,
    };
  }

  /** Release year, parsed from a `(YYYY)` in the name. */
  get year(): number | null {
    const match = this.torrentName.match(/\((\d{4})\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  isTVEpisode(): boolean {
    return this.episodeMarker !== null || this.seasonPack !== null;
  }

  isMovie(): boolean {
    return !this.isTVEpisode();
  }

  matchesSeason(season: number): boolean {
    return (
      this.episodeMarker?.season === season ||
      this.seasonPack?.season === season
    );
  }

  matchesEpisode(season: number, episode: number): boolean {
    const marker = this.episodeMarker;
    return marker?.season === season && marker?.episode === episode;
  }
}
