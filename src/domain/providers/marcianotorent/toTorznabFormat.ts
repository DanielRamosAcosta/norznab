import { MarcianoTorrentFormat } from "./client/models/MarcianoTorrentFormat.ts";

export function toTorznabFormat(format: MarcianoTorrentFormat): string {
  const mapping: Record<MarcianoTorrentFormat, string> = {
    [MarcianoTorrentFormat.HDRIP]: "720p",
    [MarcianoTorrentFormat.DVDRip]: "DVDRip",
    [MarcianoTorrentFormat.SCREENER]: "480p",
    [MarcianoTorrentFormat.UHD_4K]: "2160p",
    [MarcianoTorrentFormat.MICROHD_1080P]: "1080p",
    [MarcianoTorrentFormat.MICROHD_720P]: "720p",
    [MarcianoTorrentFormat.BLURAY_720P]: "720p",
    [MarcianoTorrentFormat.BLURAY_1080P]: "1080p",
    [MarcianoTorrentFormat.BDREMUX_1080P]: "1080p",
    [MarcianoTorrentFormat.HDTV]: "HDTV",
    [MarcianoTorrentFormat.HDTV_720P]: "720p",
    [MarcianoTorrentFormat.HDTV_1080P]: "1080p",
    [MarcianoTorrentFormat.SAT_RIP]: "480p",
  };
  return mapping[format];
}
