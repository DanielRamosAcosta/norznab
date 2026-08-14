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
import type { Logger } from "../../services/Logger.ts";
import { LoggerNoop } from "../../services/LoggerNoop.ts";

export class Wolfmax4kTVAdapter implements TVAdapter {
  private readonly wolfmax4k: Wolfmax4kWrapper;
  private readonly logger: Logger;

  public static async create(context: ResolutionContext) {
    const [wrapper, logger] = await Promise.all([
      context.getAsync<Wolfmax4kWrapper>(Token.WOLFMAX4K_WRAPPER),
      context.getAsync<Logger>(Token.LOGGER),
    ]);
    return new Wolfmax4kTVAdapter(wrapper, logger);
  }

  constructor(wolfmax4k: Wolfmax4kWrapper, logger: Logger = new LoggerNoop()) {
    this.wolfmax4k = wolfmax4k;
    this.logger = logger.forClass(Wolfmax4kTVAdapter.name);
  }

  async findBy(criteria: SearchCriteria): Promise<TorznabItemTV[]> {
    const startedAt = Date.now();
    const results = await this.wolfmax4k.searchAll(criteria.name);
    const episodes = results.filter((result) => this.matches(result, criteria));
    this.logger.debug("findBy resolving releases", {
      name: criteria.name,
      matches: episodes.length,
    });
    const items = await Promise.all(
      episodes.map((episode) => this.extractEpisode(criteria.name, episode)),
    );
    const resolved = filterEmpty(items);
    this.logger.debug("findBy done", {
      name: criteria.name,
      matches: episodes.length,
      resolved: resolved.length,
      ms: Date.now() - startedAt,
    });
    return resolved;
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
    const episode = result.episodeMarker;
    const pack = result.seasonPack;
    if (!episode && !pack) {
      return null;
    }

    // Season packs carry a season but no single episode (e.g. "Show S05").
    const season = (episode ?? pack)!.season;
    const code = episode
      ? `S${pad(season)}E${pad(episode.episode)}`
      : `S${pad(season)}`;

    try {
      const buffer = await this.wolfmax4k.getTorrent(result.guid);
      const parsed = await parseTorrent(buffer);
      const link = toMagnetURI(parsed);
      const format = toTorznabFormat(result.quality);

      return {
        type: "tv",
        title: `${showName} ${code} ${format} - Wolfmax4k (${result.quality})`,
        link,
        size: "length" in parsed ? (parsed.length ?? 0) : 0,
        category: 5000,
        season,
        ...(episode ? { episode: episode.episode } : {}),
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
