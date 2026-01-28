import type { DonTorrentFormat } from "./DonTorrentFormat.ts";

export type DonTorrentEpisodeMetadata = {
  contentId: number;
  table: string;
  title: string;
  date: string;
};

export type DonTorrentShowSeasonMetadata = {
  format: DonTorrentFormat;
  episodes: DonTorrentEpisodeMetadata[];
};
