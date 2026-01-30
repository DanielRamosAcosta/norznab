import type { DonTorrentFormat } from "./DonTorrentFormat.ts";
import { DonTorrentEpisodeMetadata } from "./DonTorrentEpisodeMetadata.ts";
import { EpisodeEntry } from "./EpisodeEntry.ts";

export type DonTorrentShowSeasonMetadata = {
  name: string;
  format: DonTorrentFormat;
  episodes: DonTorrentEpisodeMetadata[];
};

export function toEntries(metadata: DonTorrentShowSeasonMetadata) {
  return metadata.episodes.map((e) => EpisodeEntry.parse(e, metadata.format));
}
