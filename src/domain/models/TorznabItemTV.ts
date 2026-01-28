import type { TorznabItemBase } from "./TorznabItemBase.ts";

/**
 * Torznab item for TV show releases.
 *
 * @example
 * const tvItem: TorznabItemTV = {
 *   size: "252322",
 *   category: "5000",
 *   season: "1",
 *   episode: "1",
 *   tvtitle: "Breaking Bad",
 *   video: "x264",
 *   audio: "AC3 2.0 @ 384 kbs"
 * };
 */
export type TorznabItemTV = TorznabItemBase & {
  type: "tv";

  /**
   * Numeric season.
   * @example "1"
   */
  season?: number;

  /**
   * Numeric episode within the season.
   * @example "1"
   */
  episode?: number;

  /**
   * TVRage ID.
   * @example "2322"
   */
  rageid?: string;

  /**
   * TVRage Show Title.
   * @example "The Show Title"
   */
  tvtitle?: string;

  /**
   * TVRage Show Air date.
   * @example "Tue, 22 Jun 2010 06:54:22 +0100"
   */
  tvairdate?: string;

  /**
   * Video codec.
   * @example "x264"
   */
  video?: string;

  /**
   * Audio codec.
   * @example "AC3 2.0 @ 384 kbs"
   */
  audio?: string;

  /**
   * Video resolution.
   * @example "1280x716 1.78:1"
   */
  resolution?: string;

  /**
   * Video framerate in fps.
   * @example "23.976 fps"
   */
  framerate?: string;

  /**
   * Natural language(s).
   * @example "English"
   */
  language?: string;

  /**
   * Subtitles.
   * @example "English, Spanish"
   */
  subs?: string;

  /**
   * Genre.
   * @example "Drama, Crime"
   */
  genre?: string;
};
