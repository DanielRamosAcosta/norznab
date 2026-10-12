import { describe, it, expect } from "vitest";
import { buildReleaseTitle } from "./buildReleaseTitle.ts";
import type { EliteTorrentRelease } from "./client/EliteTorrent.ts";

function release(over: Partial<EliteTorrentRelease>): EliteTorrentRelease {
  return {
    name: "",
    magnet: "magnet:?xt=urn:btih:x",
    size: 0,
    pubDate: new Date(0).toUTCString(),
    quality: "",
    format: "",
    language: "",
    year: null,
    ...over,
  };
}

describe("buildReleaseTitle", () => {
  it("keeps the magnet name when it already carries a quality token", () => {
    const r = release({ name: "Matrix [BluRay 720p X264 MKV]" });
    expect(buildReleaseTitle("Matrix (HDRip)", r)).toBe(
      "Matrix [BluRay 720p X264 MKV]",
    );
  });

  it("synthesizes a parseable title when the magnet has no dn (Dune)", () => {
    const r = release({
      name: "",
      quality: "720p",
      format: "MP4",
      language: "Spanish",
      year: 2024,
    });
    // Was "Dune: Parte dos" (quality Unknown -> Radarr rejected it).
    expect(buildReleaseTitle("Dune: Parte dos", r)).toBe(
      "Dune: Parte dos 2024 720p MP4 Spanish",
    );
  });

  it("maps a wordy quality label through toTorznabFormat", () => {
    const r = release({ quality: "BluRay 1080p", year: 2021 });
    expect(buildReleaseTitle("Alguna Peli", r)).toBe(
      "Alguna Peli 2021 1080p BluRay",
    );
  });

  it("falls back to the bare title when no metadata is available", () => {
    expect(buildReleaseTitle("Pelicula Sin Datos", release({}))).toBe(
      "Pelicula Sin Datos",
    );
  });
});
