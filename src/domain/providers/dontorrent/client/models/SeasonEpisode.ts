import { SeasonNumber } from "./SeasonNumber.ts";
import { EpisodeNumber } from "./EpisodeNumber.ts";

export class SeasonEpisode {
  readonly season: SeasonNumber;
  readonly episode: EpisodeNumber;

  private constructor(season: SeasonNumber, episode: EpisodeNumber) {
    this.season = season;
    this.episode = episode;
  }

  static from(season: number, episode: number): SeasonEpisode {
    return new SeasonEpisode(
      SeasonNumber.from(season),
      EpisodeNumber.from(episode),
    );
  }

  static fromVOs(season: SeasonNumber, episode: EpisodeNumber): SeasonEpisode {
    return new SeasonEpisode(season, episode);
  }

  toString(): string {
    return `${this.season}${this.episode}`;
  }

  equals(other: SeasonEpisode): boolean {
    return (
      this.season.equals(other.season) && this.episode.equals(other.episode)
    );
  }
}
