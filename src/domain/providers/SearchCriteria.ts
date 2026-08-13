/**
 * Search criteria shared by every TV provider adapter.
 *
 * A criteria always carries the show name and season; the episode variant adds
 * a concrete episode number so adapters can match a single release.
 */
export abstract class SearchCriteria {
  readonly name: string;
  readonly season: number;

  constructor(name: string, season: number) {
    this.name = name;
    this.season = season;
  }
}

export class SearchCriteriaSeason extends SearchCriteria {}

export class SearchCriteriaEpisode extends SearchCriteria {
  readonly episode: number;

  constructor(name: string, season: number, episode: number) {
    super(name, season);
    this.episode = episode;
  }
}
