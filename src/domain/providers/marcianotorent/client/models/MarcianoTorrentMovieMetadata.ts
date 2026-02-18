import type { MarcianoTorrentFormat } from "./MarcianoTorrentFormat.ts";

export interface MarcianoTorrentMovieMetadata {
  title: string;
  year: number;
  format: MarcianoTorrentFormat;
  torrentPath: string;
}
