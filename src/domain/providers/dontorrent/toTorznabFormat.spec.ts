import { describe, it, expect } from "vitest";
import { toTorznabFormat } from "./toTorznabFormat.ts";
import {
  DonTorrentFormat,
  parseDonTorrentFormat,
} from "./client/models/DonTorrentFormat.ts";

describe("DonTorrent formats", () => {
  it("parses and maps DVDscreener (regression: it used to throw)", () => {
    const format = parseDonTorrentFormat("DVDscreener");
    expect(format).toBe(DonTorrentFormat.DVD_SCREENER);
    expect(toTorznabFormat(format)).toBe("480p");
  });

  it("has a torznab mapping for every known format", () => {
    for (const format of Object.values(DonTorrentFormat)) {
      expect(toTorznabFormat(format)).toBeTruthy();
    }
  });

  it("throws on a genuinely unknown format", () => {
    expect(() => parseDonTorrentFormat("NotARealFormat")).toThrow();
  });
});
