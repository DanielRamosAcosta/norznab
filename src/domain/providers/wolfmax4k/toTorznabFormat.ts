/**
 * Maps a wolfmax4k `calidad` string (e.g. "BluRay 1080p", "4KUHDremux",
 * "HDTV 720p AC3 5.1") into a resolution + source token that Sonarr/Radarr
 * release parsers understand (e.g. "1080p BluRay", "2160p Remux").
 */
export function toTorznabFormat(quality: string): string {
  const value = quality.toLowerCase();

  const resolution = toResolution(value);
  const source = toSource(value);

  return [resolution, source].filter(Boolean).join(" ") || quality;
}

function toResolution(value: string): string | null {
  if (/4k|2160|uhd/.test(value)) return "2160p";
  if (/1080|microhd/.test(value)) return "1080p";
  if (/720/.test(value)) return "720p";
  if (/480/.test(value)) return "480p";
  return null;
}

function toSource(value: string): string | null {
  if (/remux/.test(value)) return "Remux";
  if (/bluray|bluray/.test(value)) return "BluRay";
  if (/hdtv/.test(value)) return "HDTV";
  if (/web-?dl|webdl/.test(value)) return "WEB-DL";
  if (/dvdrip|dvd-rip/.test(value)) return "DVDRip";
  if (/screener|scr/.test(value)) return "Screener";
  if (/camrip|cam/.test(value)) return "CAM";
  if (/ts-screener|telesync|\bts\b/.test(value)) return "TELESYNC";
  if (/dvd5|dvd9|iso/.test(value)) return "DVD";
  return null;
}
