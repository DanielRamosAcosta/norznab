export class EpisodeNumber {
  readonly value: number;

  private constructor(value: number) {
    if (value < 0) {
      throw new Error(`Episode must be >= 0, got: ${value}`);
    }
    this.value = value;
  }

  static from(value: number): EpisodeNumber {
    return new EpisodeNumber(value);
  }

  toString(): string {
    return `E${this.value.toString().padStart(2, "0")}`;
  }

  equals(other: EpisodeNumber): boolean {
    return this.value === other.value;
  }
}
