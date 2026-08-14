/**
 * Reduces a movie title to its main title for sources whose search matches
 * strictly (DonTorrent, wolfmax4k, MarcianoTorrent). A Spanish subtitle after a
 * ":" or ". " rarely appears in the release name, so searching the full title
 * (e.g. "Sin City: Ciudad del pecado", "Stargate. Puerta a las estrellas")
 * returns nothing on those sites. Querying the main title returns the release,
 * which the \*arr client then matches exactly by title + year.
 *
 * EliteTorrent's full-text search copes with the full title, so it does not use
 * this.
 */
export function movieSearchTerm(title: string): string {
  let term = title.split(":")[0].trim();
  const beforePeriod = term.split(/\.\s+/)[0].trim();
  // Keep short leading abbreviations intact ("Mr. Robot", "Dr. No", "L.A. …").
  if (beforePeriod.length > 3) {
    term = beforePeriod;
  }
  return term || title;
}
