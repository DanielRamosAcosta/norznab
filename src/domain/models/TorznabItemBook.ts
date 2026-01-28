import type { TorznabItemBase } from "./TorznabItemBase.ts";

/**
 * Torznab item for book releases.
 *
 * @example
 * const bookItem: TorznabItemBook = {
 *   size: "5000000",
 *   category: "8000",
 *   booktitle: "The Hobbit",
 *   author: "J.R.R. Tolkien",
 *   publishdate: "Tue, 21 Sep 1937 00:00:00 +0000",
 *   pages: "310"
 * };
 */
export type TorznabItemBook = TorznabItemBase & {
  type: "book";

  /**
   * Publisher name.
   * @example "Allen & Unwin"
   */
  publisher?: string;

  /**
   * Book title.
   * @example "The Hobbit"
   */
  booktitle?: string;

  /**
   * Date book published.
   * @example "Tue, 21 Sep 1937 00:00:00 +0000"
   */
  publishdate?: string;

  /**
   * Book author.
   * @example "J.R.R. Tolkien"
   */
  author?: string;

  /**
   * Number of pages.
   * @example "310"
   */
  pages?: string;

  /**
   * URL to cover image.
   * @example "http://servername.com/covers/books/12345.jpg"
   */
  coverurl?: string;

  /**
   * URL to backdrop image.
   * @example "http://servername.com/covers/books/12345-backdrop.jpg"
   */
  backdropcoverurl?: string;

  /**
   * Critics review.
   * @example "A timeless fantasy adventure"
   */
  review?: string;
};
