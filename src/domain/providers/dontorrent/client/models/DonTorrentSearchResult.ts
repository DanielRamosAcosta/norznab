import type { SearchCriteria } from "../../Criterias.ts";
import type { DonTorrentWrapper } from "../../DonTorrentWrapper.ts";
import type { DonTorrent } from "../DonTorrent.ts";
import type { DonTorrentMediaType } from "./DonTorrentMediaType.ts";
import { isTVShow as typeIsTVShow } from "./DonTorrentMediaType.ts";
import { isMovie as typeIsMovie } from "./DonTorrentMediaType.ts";
import { toEntries } from "./DonTorrentShowSeasonMetadata.ts";
import { ResultSeason } from "./ResultSeason.ts";

export class DonTorrentSearchResult {
  readonly path: string;
  readonly name: string;
  readonly type: DonTorrentMediaType;

  constructor(path: string, name: string, type: DonTorrentMediaType) {
    this.path = path;
    this.name = name;
    this.type = type;
  }

  isTVShow(): boolean {
    return typeIsTVShow(this.type);
  }

  isMovie(): boolean {
    return typeIsMovie(this.type);
  }

  includes(seasonNumber: number) {
    if (this.isMovie()) return false;
    return ResultSeason.parse(this.name).includes(seasonNumber);
  }

  async extract(donTorrent: DonTorrentWrapper, criteria: SearchCriteria) {
    const showMetadata = await donTorrent.getShowMetadata(this.path);

    const promises = toEntries(showMetadata)
      .filter((entry) => entry.matches(criteria))
      .map((entry) => entry.toTorznab(donTorrent, criteria.name));

    return await Promise.all(promises);
  }
}
