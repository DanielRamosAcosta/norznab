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
