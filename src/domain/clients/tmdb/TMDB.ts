import type { KyInstance } from "ky";
import ky from "ky";
import type { ResolutionContext } from "inversify";
import { FindResponseSchema, type FindResponse } from "./schemas/find.ts";
import {
  SearchTVResponseSchema,
  type SearchTVResponse,
} from "./schemas/searchTv.ts";
import {
  GetTVShowResponseSchema,
  type GetTVShowResponse,
} from "./schemas/getTvShow.ts";
import {
  GetMovieResponseSchema,
  type GetMovieResponse,
} from "./schemas/getMovie.ts";
import { Token } from "../../Token.ts";
import { config } from "../../../infrastructure/config.ts";

export interface TMDBConfig {
  apiKey: string;
}

export class TMDB {
  public static create() {
    return new TMDB({ apiKey: config.TMDB_API_KEY });
  }

  private client: KyInstance;
  private language = "es-ES";

  constructor(config: TMDBConfig) {
    this.client = ky.create({
      prefixUrl: "https://api.themoviedb.org/3",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        accept: "application/json",
      },
      retry: 0,
    });
  }

  async getTvShow(id: number): Promise<GetTVShowResponse> {
    const data = await this.client
      .get(`tv/${id}`, {
        searchParams: {
          language: this.language,
        },
      })
      .json();

    return GetTVShowResponseSchema.parse(data);
  }

  async getMovie(id: number): Promise<GetMovieResponse> {
    const data = await this.client
      .get(`movie/${id}`, {
        searchParams: {
          language: this.language,
        },
      })
      .json();

    return GetMovieResponseSchema.parse(data);
  }
}
