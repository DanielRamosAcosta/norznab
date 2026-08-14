import type { TorznabItemMovie } from "../models/TorznabItemMovie.ts";
import type { ProviderSource } from "./ProviderSource.ts";

export interface MovieAdapter {
  /** Source this adapter belongs to, used to filter by the Torznab apikey. */
  readonly source: ProviderSource;
  findMovie(movieName: string): Promise<TorznabItemMovie[]>;
}
