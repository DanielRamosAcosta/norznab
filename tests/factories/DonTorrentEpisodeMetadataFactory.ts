import { DonTorrentEpisodeMetadata } from "../../src/domain/providers/dontorrent/client/models/DonTorrentEpisodeMetadata.ts";

export function episodeMetadata({
  contentId = 1,
  table = "series",
  title = "1x01 - Default Title",
  date = "2024-01-01",
} = {}) {
  return new DonTorrentEpisodeMetadata({
    contentId,
    table,
    title,
    date,
  });
}
