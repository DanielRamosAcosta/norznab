import { toTorznabFormat } from "../utils/toTorznabFormat.ts";
import type { EliteTorrentRelease } from "./client/EliteTorrent.ts";

// Any of these tokens in a name means an *arr parser can already read the
// quality, so the name is good enough to use verbatim.
const QUALITY_TOKEN =
  /\b(2160p|1080p|720p|480p|4k|uhd|bluray|bdremux|bdrip|brrip|webrip|web-?dl|hdrip|hdtv|dvdrip|microhd)\b/i;

/**
 * Builds a release title Radarr/Sonarr can parse.
 *
 * EliteTorrent magnets usually carry a rich `dn` (e.g. `Matrix [BluRay 720p
 * X264 MKV]`) that parses cleanly, but some films (e.g. Dune) ship a magnet
 * with no `dn` at all, leaving only the bare sheet title `Dune: Parte dos`.
 * A bare title parses to quality `Unknown` and Radarr rejects it with "Unable
 * to parse release". When the name lacks any quality token we synthesize one
 * from the detail-page metadata (year + quality + container + language).
 */
export function buildReleaseTitle(
  gridTitle: string,
  release: EliteTorrentRelease,
): string {
  const base = (release.name || gridTitle).trim();
  if (QUALITY_TOKEN.test(base)) return base;

  const extra = [
    release.year ? String(release.year) : "",
    release.quality ? toTorznabFormat(release.quality) : "",
    release.format,
    release.language,
  ].filter(Boolean);

  return [base, ...extra].filter(Boolean).join(" ");
}
