import { DonTorrentFormat } from "./client/models/DonTorrentFormat.ts";

export function toTorznabFormat(format: DonTorrentFormat): string {
  const mapping: Record<DonTorrentFormat, string> = {
    [DonTorrentFormat.HDTV]: "HDTV",
    [DonTorrentFormat.HDTV_720P]: "720p HDTV",
    [DonTorrentFormat.HDTV_1080P]: "1080p HDTV",
    [DonTorrentFormat.BLURAY_720P]: "720p BluRay",
    [DonTorrentFormat.BLURAY_1080P]: "1080p BluRay",
    [DonTorrentFormat.BDREMUX_1080P]: "1080p BluRay",
    [DonTorrentFormat.MICROHD_1080P]: "1080p",
    [DonTorrentFormat.HDRIP]: "720p",
    [DonTorrentFormat.DVDRIP]: "DVDRip",
    [DonTorrentFormat.SCREENER]: "480p",
    [DonTorrentFormat.UHD_4K]: "2160p",
  };
  return mapping[format];
}
