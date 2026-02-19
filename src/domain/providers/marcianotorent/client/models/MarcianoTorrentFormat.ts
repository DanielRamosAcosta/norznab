export const MarcianoTorrentFormat = {
  HDRIP: "HDRip",
  DVDRip: "DVDRip",
  SCREENER: "Screener",
  UHD_4K: "4K",
  MICROHD_1080P: "MicroHD-1080p",
  BLURAY_1080P: "BluRay-1080p",
  BDREMUX_1080P: "BDremux-1080p",
} as const;

export type MarcianoTorrentFormat =
  (typeof MarcianoTorrentFormat)[keyof typeof MarcianoTorrentFormat];

const allFormats: readonly string[] = Object.values(MarcianoTorrentFormat);

export function isMarcianoTorrentFormat(
  format: string,
): format is MarcianoTorrentFormat {
  return allFormats.includes(format);
}

export function parseMarcianoTorrentFormat(
  format: string,
): MarcianoTorrentFormat {
  if (isMarcianoTorrentFormat(format)) {
    return format;
  }
  throw new Error("Unknown MarcianoTorrent format: " + format);
}
