import type { TorznabItemMovie } from "../models/TorznabItemMovie.ts";

export interface MovieAdapter {
  findMovie(movieName: string): Promise<TorznabItemMovie[]>;
}
