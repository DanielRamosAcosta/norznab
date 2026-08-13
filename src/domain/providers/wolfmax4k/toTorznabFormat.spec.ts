import { describe, it, expect } from "vitest";
import { toTorznabFormat } from "./toTorznabFormat.ts";

describe("toTorznabFormat", () => {
  it.each([
    ["BluRay 1080p", "1080p BluRay"],
    ["BluRay 720p", "720p BluRay"],
    ["HDTV 1080p AC3 5.1", "1080p HDTV"],
    ["HDTV 720p AC3 5.1", "720p HDTV"],
    ["HDTV", "HDTV"],
    ["4KUHDrip", "2160p"],
    ["4KUHDremux", "2160p Remux"],
    ["BluRay MicroHD", "1080p BluRay"],
    ["DVDRip", "DVDRip"],
  ])("maps %s -> %s", (quality, expected) => {
    expect(toTorznabFormat(quality)).toBe(expected);
  });

  it("falls back to the raw quality when nothing matches", () => {
    expect(toTorznabFormat("MP3")).toBe("MP3");
  });
});
