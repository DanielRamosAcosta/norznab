export const DonTorrentMediaType = {
  MOVIE: "Película",
  TV_SHOW: "Serie",
  DOCUMENTARY: "Documental",
} as const;

export type DonTorrentMediaType =
  (typeof DonTorrentMediaType)[keyof typeof DonTorrentMediaType];

const allTypes: readonly string[] = Object.values(DonTorrentMediaType);

export function isDonTorrentMediaType(
  type: string,
): type is DonTorrentMediaType {
  return allTypes.includes(type);
}

export function isTVShow(type: DonTorrentMediaType) {
  return type === DonTorrentMediaType.TV_SHOW;
}

export function isMovie(type: DonTorrentMediaType) {
  return type === DonTorrentMediaType.MOVIE;
}

export function parseDonTorrentMediaType(type: string): DonTorrentMediaType {
  if (isDonTorrentMediaType(type)) {
    return type;
  }

  throw new Error("Unknown DonTorrent media type: " + type);
}
