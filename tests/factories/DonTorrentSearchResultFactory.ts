import { DonTorrentMediaType } from "../../src/domain/providers/dontorrent/client/models/DonTorrentMediaType.ts";
import { DonTorrentSearchResult } from "../../src/domain/providers/dontorrent/client/models/DonTorrentSearchResult.ts";

export function tvSearchResult({
  path = "/path/to/movie",
  name = "Breaking Bad 1ª Temporada",
} = {}) {
  return new DonTorrentSearchResult(path, name, DonTorrentMediaType.TV_SHOW);
}
