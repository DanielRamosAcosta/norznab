import { describe, it, expect } from "vitest";
import { selectBySource } from "./selectBySource.ts";
import { ProviderSource } from "./ProviderSource.ts";

const adapters = [
  { source: ProviderSource.DONTORRENT, id: "don" },
  { source: ProviderSource.MARCIANOTORRENT, id: "marciano" },
  { source: ProviderSource.WOLFMAX4K, id: "wolf" },
];

describe("selectBySource", () => {
  it("returns every adapter when no apikey is given", () => {
    expect(selectBySource(adapters, undefined)).toEqual(adapters);
    expect(selectBySource(adapters, "")).toEqual(adapters);
    expect(selectBySource(adapters, "   ")).toEqual(adapters);
  });

  it("returns every adapter for an unknown/arbitrary apikey", () => {
    // A real *arr API key (or a typo) must not break existing indexers.
    expect(
      selectBySource(adapters, "25e7cccabdfa47898d13991d863f529c"),
    ).toEqual(adapters);
  });

  it("keeps only the matching source for a known slug", () => {
    expect(selectBySource(adapters, "dontorrent")).toEqual([adapters[0]]);
    expect(selectBySource(adapters, "wolfmax4k")).toEqual([adapters[2]]);
  });

  it("is case- and whitespace-insensitive on the slug", () => {
    expect(selectBySource(adapters, "  MarcianoTorrent  ")).toEqual([
      adapters[1],
    ]);
  });

  it("returns nothing when a known source has no bound adapter", () => {
    const onlyWolf = [{ source: ProviderSource.WOLFMAX4K, id: "wolf" }];
    expect(selectBySource(onlyWolf, "dontorrent")).toEqual([]);
  });
});
