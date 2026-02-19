export const DonTorrentFormat = {
  HDTV: "HDTV",
  HDTV_720P: "HDTV-720p",
  HDTV_1080P: "HDTV-1080p",
  BLURAY_720P: "BluRay-720p",
  BLURAY_1080P: "BluRay-1080p",
  BDREMUX_1080P: "BDremux-1080p",
  MICROHD_1080P: "MicroHD-1080p",
  MICROHD_720P: "MicroHD-720p",
  HDRIP: "HDRip",
  DVDRIP: "DVDRip",
  SCREENER: "Screener",
  BR_SCREENER: "BR-Screener",
  UHD_4K: "4K",
} as const;

export type DonTorrentFormat =
  (typeof DonTorrentFormat)[keyof typeof DonTorrentFormat];

const allFormats: readonly string[] = Object.values(DonTorrentFormat);

export function isDonTorrentFormat(format: string): format is DonTorrentFormat {
  return allFormats.includes(format);
}

export function parseDonTorrentFormat(format: string): DonTorrentFormat {
  if (isDonTorrentFormat(format)) {
    return format;
  }

  throw new Error("Unknown DonTorrent format: " + format);
}
