import { SeasonNumber } from "./SeasonNumber.ts";

export class SeasonRange {
  readonly start: SeasonNumber;
  readonly end: SeasonNumber;

  private constructor(start: SeasonNumber, end: SeasonNumber) {
    this.start = start;
    this.end = end;
  }

  static from(start: number, end: number): SeasonRange {
    return new SeasonRange(SeasonNumber.from(start), SeasonNumber.from(end));
  }

  static fromVOs(start: SeasonNumber, end: SeasonNumber): SeasonRange {
    return new SeasonRange(start, end);
  }

  toString(): string {
    return `${this.start}-${this.end}`;
  }

  containsSeason(seasonNumber: number): boolean {
    return seasonNumber >= this.start.value && seasonNumber <= this.end.value;
  }
}
