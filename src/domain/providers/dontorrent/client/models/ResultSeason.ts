import { LoggerPino } from "../../../../services/LoggerPino.ts";

const logger = LoggerPino.create().forClass("ResultSeason");

export abstract class ResultSeason {
  abstract includes(seasonNumber: number): boolean;

  static parse(name: string): ResultSeason {
    // Try formats:
    // 1. "Xª Temporada" - e.g., "1ª Temporada"
    // 2. "Temporada X-Y" - e.g., "Temporada 1-2 Completas"
    // 3. "Temporada X" - e.g., "Temporada 1"
    const log = logger.forMethod("parse");

    const ordinalMatch = name.match(/(\d+)ª Temporada/);
    if (ordinalMatch) {
      const seasonNumber = parseInt(ordinalMatch[1], 10);
      return ResultSeason.concrete(seasonNumber);
    }

    const rangeMatch = name.match(/Temporada (\d+)-(\d+)/i);
    if (rangeMatch) {
      return ResultSeason.range(
        parseInt(rangeMatch[1], 10),
        parseInt(rangeMatch[2], 10),
      );
    }

    const simpleMatch = name.match(/Temporada (\d+)/i);
    if (simpleMatch) {
      const seasonNumber = parseInt(simpleMatch[1], 10);
      return ResultSeason.concrete(seasonNumber);
    }

    log.error("Failed to parse season number from result name", {
      resultName: name,
    });

    throw new Error(`Could not parse season number from: ${name}`);
  }

  static concrete(number: number): ResultSeason {
    return new ConcreteSeason(number);
  }

  static range(start: number, end: number): ResultSeason {
    return new SeasonRange(start, end);
  }
}

class ConcreteSeason extends ResultSeason {
  readonly number: number;

  constructor(number: number) {
    super();
    this.number = number;
  }

  includes(seasonNumber: number): boolean {
    return this.number === seasonNumber;
  }
}

class SeasonRange extends ResultSeason {
  readonly start: number;
  readonly end: number;

  constructor(start: number, end: number) {
    super();
    this.start = start;
    this.end = end;
  }

  includes(seasonNumber: number): boolean {
    return seasonNumber >= this.start && seasonNumber <= this.end;
  }
}
