import type { DonTorrentFormat } from "./DonTorrentFormat.ts";

export interface DonTorrentMovieMetadata {
  contentId: number;
  table: string;
  title: string;
  year: number;
  format: DonTorrentFormat;
}
