export class SeasonNumber {
  readonly value: number;

  private constructor(value: number) {
    if (value < 1) {
      throw new Error(`Season must be >= 1, got: ${value}`);
    }
    this.value = value;
  }

  static from(value: number): SeasonNumber {
    return new SeasonNumber(value);
  }

  toString(): string {
    return `S${this.value.toString().padStart(2, "0")}`;
  }

  equals(other: SeasonNumber): boolean {
    return this.value === other.value;
  }

  greaterThanOrEqual(other: SeasonNumber): boolean {
    return this.value >= other.value;
  }

  lessThanOrEqual(other: SeasonNumber): boolean {
    return this.value <= other.value;
  }
}
