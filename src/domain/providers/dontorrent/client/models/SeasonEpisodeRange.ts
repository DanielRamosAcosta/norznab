import { SeasonEpisode } from "./SeasonEpisode.ts";

export class SeasonEpisodeRange {
  readonly start: SeasonEpisode;
  readonly end: SeasonEpisode;

  private constructor(start: SeasonEpisode, end: SeasonEpisode) {
    this.start = start;
    this.end = end;
  }

  static from(
    start: { season: number; episode: number },
    end: { season: number; episode: number },
  ): SeasonEpisodeRange {
    return new SeasonEpisodeRange(
      SeasonEpisode.from(start.season, start.episode),
      SeasonEpisode.from(end.season, end.episode),
    );
  }

  static fromVOs(start: SeasonEpisode, end: SeasonEpisode): SeasonEpisodeRange {
    return new SeasonEpisodeRange(start, end);
  }

  toString(): string {
    return `${this.start}-${this.end}`;
  }

  containsSeason(seasonNumber: number): boolean {
    return (
      seasonNumber >= this.start.season.value &&
      seasonNumber <= this.end.season.value
    );
  }

  getUniqueSeason(): number | undefined {
    if (this.start.season.equals(this.end.season)) {
      return this.start.season.value;
    }
    return undefined;
  }
}
