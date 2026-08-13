import type { ResolutionContext } from "inversify";
import parseTorrent, { toMagnetURI } from "parse-torrent";
import { Token } from "../../Token.ts";
import { filterEmpty } from "../../utils/filterNull.ts";
import type { TVAdapter } from "../TVAdapter.ts";
import {
  SearchCriteriaEpisode,
  SearchCriteriaSeason,
  type SearchCriteria,
} from "../SearchCriteria.ts";
import type { TorznabItemTV } from "../../models/TorznabItemTV.ts";
import type { Wolfmax4kWrapper } from "./Wolfmax4kWrapper.ts";
import type { Wolfmax4kSearchResult } from "./client/models/Wolfmax4kSearchResult.ts";
import { toTorznabFormat } from "./toTorznabFormat.ts";

export class Wolfmax4kTVAdapter implements TVAdapter {
  private readonly wolfmax4k: Wolfmax4kWrapper;

  public static async create(context: ResolutionContext) {
    const wrapper = await context.getAsync<Wolfmax4kWrapper>(
      Token.WOLFMAX4K_WRAPPER,
    );
    return new Wolfmax4kTVAdapter(wrapper);
  }

  constructor(wolfmax4k: Wolfmax4kWrapper) {
    this.wolfmax4k = wolfmax4k;
  }

  async findBy(criteria: SearchCriteria): Promise<TorznabItemTV[]> {
    const results = await this.wolfmax4k.searchAll(criteria.name);
    const episodes = results.filter((result) => this.matches(result, criteria));
    const items = await Promise.all(
      episodes.map((episode) => this.extractEpisode(criteria.name, episode)),
    );
    return filterEmpty(items);
  }

  private matches(
    result: Wolfmax4kSearchResult,
    criteria: SearchCriteria,
  ): boolean {
    if (!result.isTVEpisode()) {
      return false;
    }
    if (criteria instanceof SearchCriteriaEpisode) {
      return result.matchesEpisode(criteria.season, criteria.episode);
    }
    if (criteria instanceof SearchCriteriaSeason) {
      return result.matchesSeason(criteria.season);
    }
    return false;
  }

  private async extractEpisode(
    showName: string,
    result: Wolfmax4kSearchResult,
  ): Promise<TorznabItemTV | null> {
    const marker = result.episodeMarker;
    if (!marker) {
      return null;
    }

    try {
      const buffer = await this.wolfmax4k.getTorrent(result.guid);
      const parsed = await parseTorrent(buffer);
      const link = toMagnetURI(parsed);
      const format = toTorznabFormat(result.quality);
      const code = `S${pad(marker.season)}E${pad(marker.episode)}`;

      return {
        type: "tv",
        title: `${showName} ${code} ${format} - Wolfmax4k (${result.quality})`,
        link,
        size: "length" in parsed ? (parsed.length ?? 0) : 0,
        category: 5000,
        season: marker.season,
        episode: marker.episode,
        pubDate: (
          ("created" in parsed ? parsed.created : undefined) ?? new Date()
        ).toUTCString(),
      };
    } catch {
      return null;
    }
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
