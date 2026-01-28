import type { TorznabItemBase } from "./TorznabItemBase.ts";

/**
 * Torznab item for music releases.
 *
 * @example
 * const musicItem: TorznabItemMusic = {
 *   size: "150000000",
 *   category: "3000",
 *   artist: "Pink Floyd",
 *   album: "The Dark Side of the Moon",
 *   audio: "FLAC 24bit/96kHz",
 *   tracks: "01-Speak to Me|02-Breathe|03-On the Run"
 * };
 */
export type TorznabItemMusic = TorznabItemBase & {
  type: "music";

  /**
   * Artist name.
   * @example "Pink Floyd"
   */
  artist?: string;

  /**
   * Album name.
   * @example "The Dark Side of the Moon"
   */
  album?: string;

  /**
   * Publisher name.
   * @example "Harvest Records"
   */
  publisher?: string;

  /**
   * Audio codec.
   * @example "FLAC 24bit/96kHz"
   */
  audio?: string;

  /**
   * Track listing (pipe-separated).
   * @example "01-Speak to Me|02-Breathe|03-On the Run"
   */
  tracks?: string;

  /**
   * URL to cover image.
   * @example "http://servername.com/covers/music/12345.jpg"
   */
  coverurl?: string;

  /**
   * URL to backdrop image.
   * @example "http://servername.com/covers/music/12345-backdrop.jpg"
   */
  backdropcoverurl?: string;

  /**
   * Critics review.
   * @example "A monumental progressive rock album"
   */
  review?: string;
};
