import type { RSSItem } from "./RSSItem.ts";

/**
 * Base Torznab item with common attributes across all categories.
 */
export type TorznabItemBase = RSSItem & {
  /**
   * Size in bytes (required).
   * @example "252322"
   */
  size: number;

  /**
   * Item's category ID (required).
   * @example "5004"
   */
  category: number;

  /**
   * Unique release guid.
   * @example "6c6734da3e92a7b0e494e896b58081da"
   */
  guid?: string;

  /**
   * Number of files.
   * @example "4"
   */
  files?: number;

  /**
   * NNTP Poster.
   * @example "yenc@power-post"
   */
  poster?: string;

  /**
   * NNTP Group(s).
   * @example "a.b.group, a.b.tv"
   */
  group?: string;

  /**
   * Team doing the release.
   * @example "Team"
   */
  team?: string;

  /**
   * Number of times item downloaded.
   * @example "1"
   */
  grabs?: string;

  /**
   * Whether the archive is passworded.
   * - "0" = no password
   * - "1" = rar password
   * - "2" = contains inner archive
   * @example "0"
   */
  password?: string;

  /**
   * Number of comments.
   * @example "2"
   */
  comments?: string;

  /**
   * Date posted to usenet.
   * @example "Tue, 22 Jun 2010 06:54:22 +0100"
   */
  usenetdate?: string;

  /**
   * Whether the release has an NFO file.
   * @example "1"
   */
  nfo?: string;

  /**
   * Info (.nfo) file URL.
   * @example "http://site/api?t=getnfo&id=492296e74a91412aa09aef655fda75e7&raw=1"
   */
  info?: string;

  /**
   * Release year.
   * @example "2009"
   */
  year?: string;
};
