import { describe, it, expect } from "vitest";
import {
  EpisodeEntry,
  EpisodeEntryEpisode,
  EpisodeEntryEpisodeRange,
  EpisodeEntrySeasonRange,
} from "./EpisodeEntry.ts";
import { DonTorrentFormat } from "./DonTorrentFormat.ts";
import {
  SearchCriteriaEpisode,
  SearchCriteriaSeason,
} from "../../Criterias.ts";
import { episodeMetadata } from "../../../../../../tests/factories/DonTorrentEpisodeMetadataFactory.ts";

describe("EpisodeEntry", () => {
  const format: DonTorrentFormat = DonTorrentFormat.HDTV;

  describe("parse", () => {
    it("parses single episode with lowercase x", () => {
      const metadata = episodeMetadata({ title: "1x01 - Piloto." });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntryEpisode);
    });

    it("parses single episode with uppercase X", () => {
      const metadata = episodeMetadata({ title: "2X05 - Title" });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntryEpisode);
    });

    it("parses single episode with × character", () => {
      const metadata = episodeMetadata({
        title: "8×00 - (Especial: La Última Guardia).",
      });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntryEpisode);
    });

    it("parses episode range", () => {
      const metadata = episodeMetadata({ title: "1x01 al 1x07" });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntryEpisodeRange);
    });

    it("parses episode range with uppercase X", () => {
      const metadata = episodeMetadata({ title: "2X01 al 2X13" });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntryEpisodeRange);
    });

    it("parses episode range with × character", () => {
      const metadata = episodeMetadata({ title: "3×01 al 3×10" });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntryEpisodeRange);
    });

    it("parses season range", () => {
      const metadata = episodeMetadata({ title: "Temporada 1-2 Completas" });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntrySeasonRange);
    });

    it("parses season range case insensitive", () => {
      const metadata = episodeMetadata({ title: "temporada 3-5 completas" });

      const result = EpisodeEntry.parse(metadata, format);

      expect(result).toBeInstanceOf(EpisodeEntrySeasonRange);
    });

    it("throws error for unparseable format", () => {
      const metadata = episodeMetadata({ title: "Invalid Format" });

      expect(() => EpisodeEntry.parse(metadata, format)).toThrow(
        "Could not parse episode format from: Invalid Format",
      );
    });
  });

  describe("EpisodeEntryEpisode", () => {
    describe("matches", () => {
      it("matches when season and episode match exactly", () => {
        const metadata = episodeMetadata({ title: "2x05" });
        const entry = new EpisodeEntryEpisode(metadata, format, 2, 5);
        const criteria = new SearchCriteriaEpisode("Breaking Bad", 2, 5);

        const result = entry.matches(criteria);

        expect(result).toBe(true);
      });

      it("does not match when season differs", () => {
        const metadata = episodeMetadata({ title: "2x05" });
        const entry = new EpisodeEntryEpisode(metadata, format, 2, 5);
        const criteria = new SearchCriteriaEpisode("Breaking Bad", 3, 5);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });

      it("does not match when episode differs", () => {
        const metadata = episodeMetadata({ title: "2x05" });
        const entry = new EpisodeEntryEpisode(metadata, format, 2, 5);
        const criteria = new SearchCriteriaEpisode("Breaking Bad", 2, 6);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });

      it("does not match season criteria", () => {
        const metadata = episodeMetadata({ title: "2x05" });
        const entry = new EpisodeEntryEpisode(metadata, format, 2, 5);
        const criteria = new SearchCriteriaSeason("Breaking Bad", 2);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });
    });

  });

  describe("EpisodeEntryEpisodeRange", () => {
    describe("matches", () => {
      it("matches when season is in range", () => {
        const metadata = episodeMetadata({ title: "2x01 al 2x07" });
        const entry = new EpisodeEntryEpisodeRange(
          metadata,
          format,
          { season: 2, episode: 1 },
          { season: 2, episode: 7 },
        );
        const criteria = new SearchCriteriaSeason("Breaking Bad", 2);

        const result = entry.matches(criteria);

        expect(result).toBe(true);
      });

      it("does not match when season is below range", () => {
        const metadata = episodeMetadata({ title: "2x01 al 2x07" });
        const entry = new EpisodeEntryEpisodeRange(
          metadata,
          format,
          { season: 2, episode: 1 },
          { season: 2, episode: 7 },
        );
        const criteria = new SearchCriteriaSeason("Breaking Bad", 1);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });

      it("does not match when season is above range", () => {
        const metadata = episodeMetadata({ title: "2x01 al 2x07" });
        const entry = new EpisodeEntryEpisodeRange(
          metadata,
          format,
          { season: 2, episode: 1 },
          { season: 2, episode: 7 },
        );
        const criteria = new SearchCriteriaSeason("Breaking Bad", 3);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });

      it("matches multi-season range", () => {
        const metadata = episodeMetadata({ title: "1x05 al 2x03" });
        const entry = new EpisodeEntryEpisodeRange(
          metadata,
          format,
          { season: 1, episode: 5 },
          { season: 2, episode: 3 },
        );
        const criteriaSeason1 = new SearchCriteriaSeason("Show", 1);
        const criteriaSeason2 = new SearchCriteriaSeason("Show", 2);

        const result1 = entry.matches(criteriaSeason1);
        const result2 = entry.matches(criteriaSeason2);

        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });

      it("does not match episode criteria", () => {
        const metadata = episodeMetadata({ title: "2x01 al 2x07" });
        const entry = new EpisodeEntryEpisodeRange(
          metadata,
          format,
          { season: 2, episode: 1 },
          { season: 2, episode: 7 },
        );
        const criteria = new SearchCriteriaEpisode("Show", 2, 5);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });
    });

  });

  describe("EpisodeEntrySeasonRange", () => {
    describe("matches", () => {
      it("matches when season is in range", () => {
        const metadata = episodeMetadata({ title: "Temporada 1-3 Completas" });
        const entry = new EpisodeEntrySeasonRange(metadata, format, 1, 3);
        const criteria = new SearchCriteriaSeason("Show", 2);

        const result = entry.matches(criteria);

        expect(result).toBe(true);
      });

      it("matches at start of range", () => {
        const metadata = episodeMetadata({ title: "Temporada 1-3 Completas" });
        const entry = new EpisodeEntrySeasonRange(metadata, format, 1, 3);
        const criteria = new SearchCriteriaSeason("Show", 1);

        const result = entry.matches(criteria);

        expect(result).toBe(true);
      });

      it("matches at end of range", () => {
        const metadata = episodeMetadata({ title: "Temporada 1-3 Completas" });
        const entry = new EpisodeEntrySeasonRange(metadata, format, 1, 3);
        const criteria = new SearchCriteriaSeason("Show", 3);

        const result = entry.matches(criteria);

        expect(result).toBe(true);
      });

      it("does not match when season is below range", () => {
        const metadata = episodeMetadata({ title: "Temporada 2-4 Completas" });
        const entry = new EpisodeEntrySeasonRange(metadata, format, 2, 4);
        const criteria = new SearchCriteriaSeason("Show", 1);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });

      it("does not match when season is above range", () => {
        const metadata = episodeMetadata({ title: "Temporada 2-4 Completas" });
        const entry = new EpisodeEntrySeasonRange(metadata, format, 2, 4);
        const criteria = new SearchCriteriaSeason("Show", 5);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });

      it("does not match episode criteria", () => {
        const metadata = episodeMetadata({ title: "Temporada 1-3 Completas" });
        const entry = new EpisodeEntrySeasonRange(metadata, format, 1, 3);
        const criteria = new SearchCriteriaEpisode("Show", 2, 5);

        const result = entry.matches(criteria);

        expect(result).toBe(false);
      });
    });

  });
});
