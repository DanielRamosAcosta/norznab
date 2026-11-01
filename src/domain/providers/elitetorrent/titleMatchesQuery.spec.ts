import { describe, it, expect } from "vitest";
import { titleMatchesQuery } from "./titleMatchesQuery.ts";

// Real titles returned by EliteTorrent's `?s=el libro de la vida` search.
const REAL_NOISE = [
  "Bambi-una-vida-en-el-bosque-(2024)-[4k-2160p][Esp]",
  "Dalia-y-el-libro-rojo-(2024)-LAT.mp4 2024 720p MP4 Spanish",
  "La gran aventura de los Lunnis y el libro mágico [1080p][Castellano]",
  "Angela Christmas [HDrip][Subtitulado]",
  "Jean Francois Sentido de la Vida [1080p][Castellano]",
  "El libro secreto de Henry [1080p][Español]",
  "El libro de la selva (HDRip)",
  "El libro de la selva (microHD)",
  "El libro de la selva (BR-LINE) 2016",
  "Retales de una vida (The adderall diaries) (HDRip)",
  "El secreto del libro de Kells (DVDRip)",
  "Las dos vidas de Andres Rabadan (DVDRip)",
  "Teresa [1080p][VOSE]",
  "El-exorcista-del-papa.mkv 2023 1080p mkv Spanish",
  "Perfect-Days-(2023)-cast.mp4 2023 720p MP4 Spanish",
  "Argylle 2024 1080p MP4 Spanish",
];

describe("titleMatchesQuery", () => {
  it("drops every noise title for 'el libro de la vida'", () => {
    const query = "el libro de la vida";
    const kept = REAL_NOISE.filter((t) => titleMatchesQuery(query, t));
    expect(kept).toEqual([]);
  });

  it("keeps the real movie and its release variants", () => {
    const query = "el libro de la vida";
    expect(titleMatchesQuery(query, "El libro de la vida (HDRip)")).toBe(true);
    expect(
      titleMatchesQuery(query, "El libro de la vida [1080p][Castellano]"),
    ).toBe(true);
    // accent / plural tolerance
    expect(titleMatchesQuery("accion", "Película de Acción 2020")).toBe(true);
    expect(titleMatchesQuery("libro", "Los libros perdidos")).toBe(true);
  });

  it("keeps a single-keyword query that matches", () => {
    expect(titleMatchesQuery("matrix", "Matrix (HDRip)")).toBe(true);
    expect(titleMatchesQuery("matrix", "El libro de la selva")).toBe(false);
  });

  it("does not over-filter when the query is only stopwords", () => {
    expect(titleMatchesQuery("de la", "Cualquier cosa")).toBe(true);
  });
});
