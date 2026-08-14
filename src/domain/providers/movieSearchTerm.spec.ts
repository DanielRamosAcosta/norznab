import { describe, it, expect } from "vitest";
import { movieSearchTerm } from "./movieSearchTerm.ts";

describe("movieSearchTerm", () => {
  it("drops a subtitle after a colon", () => {
    expect(movieSearchTerm("X-Men orígenes: Lobezno")).toBe("X-Men orígenes");
    expect(movieSearchTerm("Sin City: Ciudad del pecado")).toBe("Sin City");
  });

  it("drops a subtitle after a period+space", () => {
    expect(movieSearchTerm("Stargate. Puerta a las estrellas")).toBe(
      "Stargate",
    );
  });

  it("leaves titles without a subtitle separator untouched", () => {
    expect(movieSearchTerm("The Matrix")).toBe("The Matrix");
    expect(movieSearchTerm("Blade Runner 2049")).toBe("Blade Runner 2049");
  });

  it("keeps short leading abbreviations intact", () => {
    expect(movieSearchTerm("Mr. Robot")).toBe("Mr. Robot");
    expect(movieSearchTerm("Dr. No")).toBe("Dr. No");
    expect(movieSearchTerm("L.A. Confidential")).toBe("L.A. Confidential");
  });
});
