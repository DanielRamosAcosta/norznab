import { MarcianoTorrentFormat } from "./client/models/MarcianoTorrentFormat.ts";

export function toTorznabFormat(format: MarcianoTorrentFormat): string {
  const mapping: Record<MarcianoTorrentFormat, string> = {
    [MarcianoTorrentFormat.HDRIP]: "720p",
    [MarcianoTorrentFormat.DVDRip]: "DVDRip",
    [MarcianoTorrentFormat.SCREENER]: "480p",
    [MarcianoTorrentFormat.UHD_4K]: "2160p",
  };
  return mapping[format];
}
