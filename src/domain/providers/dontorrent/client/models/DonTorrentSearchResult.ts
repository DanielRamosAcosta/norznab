import type { DonTorrentMediaType } from "./DonTorrentMediaType.ts";
import { isTVShow as typeIsTVShow } from "./DonTorrentMediaType.ts";
import { isMovie as typeIsMovie } from "./DonTorrentMediaType.ts";

export type DonTorrentSearchResult = {
  path: string;
  name: string;
  type: DonTorrentMediaType;
};

export function isTVShow(result: DonTorrentSearchResult) {
  return typeIsTVShow(result.type);
}

export function isMovie(result: DonTorrentSearchResult) {
  return typeIsMovie(result.type);
}
