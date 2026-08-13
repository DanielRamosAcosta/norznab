import type { ResolutionContext } from "inversify";
import type { TorznabItemTV } from "../../models/TorznabItemTV.ts";
import type { DonTorrentWrapper } from "./DonTorrentWrapper.ts";
import { Token } from "../../Token.ts";
import { SearchCriteria } from "./Criterias.ts";
import type { TVAdapter } from "../TVAdapter.ts";

export class DonTorrentTVAdapter implements TVAdapter {
  private readonly donTorrent: DonTorrentWrapper;

  public static async create(context: ResolutionContext) {
    const wrapper = await context.getAsync<DonTorrentWrapper>(
      Token.DONTORRENT_WRAPPER,
    );
    return new DonTorrentTVAdapter(wrapper);
  }

  constructor(donTorrent: DonTorrentWrapper) {
    this.donTorrent = donTorrent;
  }

  async findBy(criteria: SearchCriteria): Promise<TorznabItemTV[]> {
    const results = await this.donTorrent.searchAll(criteria.name);
    const promises = results
      .filter((r) => r.isTVShow())
      .filter((r) => r.includes(criteria.season))
      .map((result) => result.extract(this.donTorrent, criteria));
    const episodes = await Promise.all(promises);
    return episodes.flat();
  }
}
