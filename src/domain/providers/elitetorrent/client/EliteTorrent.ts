export interface EliteTorrentSearchResult {
  /** Detail-page path, e.g. `/peliculas/matrix-hdrip-bittorrent-hd-1/`. */
  path: string;
  /** Title as shown on the results grid, e.g. `Matrix (HDRip)`. */
  title: string;
}

export interface EliteTorrentRelease {
  /** Release name taken from the magnet `dn`, e.g. `Matrix (HDRip)`. Empty when
   * the magnet carries no `dn` (as happens for some films, e.g. Dune). */
  name: string;
  /** Ready-to-use magnet URI. */
  magnet: string;
  /** Size in bytes (best-effort, parsed from the detail page). */
  size: number;
  /** Publication date as an RFC-1123 string. */
  pubDate: string;
  /** Raw `Calidad:` label from the detail page, e.g. `720p` or `BluRay 1080p`. */
  quality: string;
  /** Raw `Formato:` container from the detail page, e.g. `MP4` or `MKV`. */
  format: string;
  /** Natural language mapped to a Torznab token, e.g. `Spanish`. */
  language: string;
  /** Release year parsed from the detail page `Fecha:`, or null when absent. */
  year: number | null;
}

export interface EliteTorrent {
  search(query: string): Promise<EliteTorrentSearchResult[]>;
  /** Release for a detail page, or null when the page has no download. */
  getRelease(path: string): Promise<EliteTorrentRelease | null>;
}
