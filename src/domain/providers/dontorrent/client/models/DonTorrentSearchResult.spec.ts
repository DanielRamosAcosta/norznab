import { describe, it, expect } from "vitest";
import { DonTorrentSearchResult } from "./DonTorrentSearchResult.ts";
import { DonTorrentMediaType } from "./DonTorrentMediaType.ts";
import { tvSearchResult } from "../../../../../../tests/factories/DonTorrentSearchResultFactory.ts";

describe("DonTorrentSearchResult", () => {
  describe("includes(seasonNumber)", () => {
    it("returns false for movies", () => {
      const result = new DonTorrentSearchResult(
        "/path/to/movie",
        "The Matrix",
        DonTorrentMediaType.MOVIE,
      );

      expect(result.includes(1)).toBe(false);
      expect(result.includes(2)).toBe(false);
    });

    it("returns true when season number matches - ordinal format", () => {
      const result = tvSearchResult({
        name: "Breaking Bad 1ª Temporada",
      });

      expect(result.includes(1)).toBe(true);
    });

    it("returns false when season number does not match - ordinal format", () => {
      const result = tvSearchResult({
        name: "Breaking Bad 1ª Temporada",
      });

      expect(result.includes(2)).toBe(false);
      expect(result.includes(3)).toBe(false);
    });

    it("returns true when season number matches - simple format", () => {
      const result = tvSearchResult({
        name: "Breaking Bad Temporada 3",
      });

      expect(result.includes(3)).toBe(true);
    });

    it("returns false when season number does not match - simple format", () => {
      const result = tvSearchResult({
        name: "Breaking Bad Temporada 3",
      });

      expect(result.includes(1)).toBe(false);
      expect(result.includes(4)).toBe(false);
    });

    it("returns true when season number is in range", () => {
      const result = tvSearchResult({
        name: "Breaking Bad Temporada 1-3",
      });

      expect(result.includes(1)).toBe(true);
      expect(result.includes(2)).toBe(true);
      expect(result.includes(3)).toBe(true);
    });

    it("returns false when season number is outside range", () => {
      const result = tvSearchResult({
        name: "Breaking Bad Temporada 1-3",
      });

      expect(result.includes(0)).toBe(false);
      expect(result.includes(4)).toBe(false);
      expect(result.includes(5)).toBe(false);
    });

    it("returns true for multi-digit season numbers - ordinal format", () => {
      const result = tvSearchResult({
        name: "Grey's Anatomy 15ª Temporada",
      });

      expect(result.includes(15)).toBe(true);
    });

    it("returns true for multi-digit season numbers - simple format", () => {
      const result = tvSearchResult({
        name: "Grey's Anatomy Temporada 15",
      });

      expect(result.includes(15)).toBe(true);
    });

    it("returns true for multi-digit season range", () => {
      const result = tvSearchResult({
        name: "Grey's Anatomy Temporada 10-15 Completas",
      });

      expect(result.includes(10)).toBe(true);
      expect(result.includes(12)).toBe(true);
      expect(result.includes(15)).toBe(true);
      expect(result.includes(9)).toBe(false);
      expect(result.includes(16)).toBe(false);
    });

    it("works with case-insensitive Temporada keyword", () => {
      const resultLower = tvSearchResult({
        name: "Breaking Bad temporada 2",
      });

      const resultUpper = tvSearchResult({
        name: "Breaking Bad TEMPORADA 2",
      });

      expect(resultLower.includes(2)).toBe(true);
      expect(resultUpper.includes(2)).toBe(true);
    });
  });
});
