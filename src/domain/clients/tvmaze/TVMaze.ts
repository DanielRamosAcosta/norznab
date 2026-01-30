import type { KyInstance } from "ky";
import ky from "ky";
import { z } from "zod";
import {
  TVMazeShowSchema,
  type TVMazeShow,
  AKAListSchema,
  type AKA,
} from "./schemas/index.ts";
import { SearchResultSchema } from "./schemas/show.ts";

export class TVMaze {
  public static create() {
    return new TVMaze();
  }

  private client: KyInstance;

  constructor() {
    this.client = ky.create({
      prefixUrl: "https://api.tvmaze.com",
      headers: {
        accept: "application/json",
      },
      retry: {
        limit: 2,
        statusCodes: [429, 500, 502, 503, 504],
      },
    });
  }

  /**
   * Lookup a show by TVMaze ID
   */
  async getShowById(id: number): Promise<TVMazeShow> {
    const data = await this.client.get(`shows/${id}`).json();
    return TVMazeShowSchema.parse(data);
  }

  /**
   * Lookup a show by TheTVDB ID
   */
  async lookupByTvdbId(tvdbId: number): Promise<TVMazeShow> {
    const data = await this.client
      .get("lookup/shows", {
        searchParams: {
          thetvdb: tvdbId,
        },
      })
      .json();
    return TVMazeShowSchema.parse(data);
  }

  /**
   * Lookup a show by IMDB ID
   */
  async lookupByImdbId(imdbId: string): Promise<TVMazeShow> {
    const data = await this.client
      .get("lookup/shows", {
        searchParams: {
          imdb: imdbId,
        },
      })
      .json();
    return TVMazeShowSchema.parse(data);
  }

  /**
   * Lookup a show by TVRage ID
   */
  async lookupByTvrageId(tvrageId: number): Promise<TVMazeShow> {
    const data = await this.client
      .get("lookup/shows", {
        searchParams: {
          tvrage: tvrageId,
        },
      })
      .json();
    return TVMazeShowSchema.parse(data);
  }

  /**
   * Search for shows by name
   */
  async searchShows(
    query: string,
  ): Promise<Array<{ score: number; show: TVMazeShow }>> {
    const data = await this.client
      .get("search/shows", {
        searchParams: {
          q: query,
        },
      })
      .json();

    return SearchResultSchema.parse(data);
  }

  /**
   * Get alternative titles (AKAs) for a show by ID
   */
  async getShowAKAs(showId: number): Promise<AKA[]> {
    const data = await this.client.get(`shows/${showId}/akas`).json();
    return AKAListSchema.parse(data);
  }
}
