import type { TorznabItemTV } from "./TorznabItemTV.ts";
import type { TorznabItemMovie } from "./TorznabItemMovie.ts";
import type { TorznabItemMusic } from "./TorznabItemMusic.ts";
import type { TorznabItemBook } from "./TorznabItemBook.ts";

/**
 * Torznab item representing a release/torrent in the Torznab protocol.
 * Can be one of four types depending on the category:
 * - TorznabItemTV for TV shows
 * - TorznabItemMovie for movies
 * - TorznabItemMusic for music/audio
 * - TorznabItemBook for books
 *
 * @example
 * const tvItem: TorznabItem = {
 *   size: "252322",
 *   category: "5000",
 *   season: "1",
 *   episode: "1",
 *   tvtitle: "Breaking Bad"
 * };
 *
 * @example
 * const movieItem: TorznabItem = {
 *   size: "4500000000",
 *   category: "2000",
 *   imdbtitle: "The Matrix"
 * };
 */
export type TorznabItem =
  | TorznabItemTV
  | TorznabItemMovie
  | TorznabItemMusic
  | TorznabItemBook;
