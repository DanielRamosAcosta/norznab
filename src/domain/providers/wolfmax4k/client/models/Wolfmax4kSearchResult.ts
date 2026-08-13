export interface EpisodeMarker {
  season: number;
  episode: number;
}

/**
 * A single entry from the wolfmax4k `data.find.php` search endpoint.
 *
 * The `guid` looks like `movie/250811`, `online/269020`, `serie-online/237445`
 * or `serie-online-hd/237346`. The prefix is NOT a reliable movie/series
 * discriminator (movies also appear under `online/`), so classification is done
 * from the release name instead: series episodes always carry a `[Cap.NNN]`
 * marker, movies carry a `(YYYY)` year.
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
   * Parses the `[Cap.NNN]` marker into a season/episode pair.
   *
   * wolfmax4k encodes it as `[Cap.SEE]` where the last two digits are the
   * episode and the leading digits are the season: `Cap.309` -> S3E09,
   * `Cap.407` -> S4E07, `Cap.1203` -> S12E03. Returns null for movies.
   */
  get episodeMarker(): EpisodeMarker | null {
    const match = this.torrentName.match(/\[cap\.\s*(\d+)\]/i);
    if (!match) {
      return null;
    }
    const digits = match[1];
    const episode = parseInt(digits.slice(-2), 10);
    const season = parseInt(digits.slice(0, -2) || "0", 10);
    return { season, episode };
  }

  /** Release year, parsed from a `(YYYY)` in the name. */
  get year(): number | null {
    const match = this.torrentName.match(/\((\d{4})\)/);
    return match ? parseInt(match[1], 10) : null;
  }

  isTVEpisode(): boolean {
    return this.episodeMarker !== null;
  }

  isMovie(): boolean {
    return !this.isTVEpisode();
  }

  matchesSeason(season: number): boolean {
    return this.episodeMarker?.season === season;
  }

  matchesEpisode(season: number, episode: number): boolean {
    const marker = this.episodeMarker;
    return marker?.season === season && marker?.episode === episode;
  }
}
