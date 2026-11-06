import z from "zod";

export const ConfigSchema = z.object({
  DON_TORRENT_BASE_URL: z.string().default("https://dontorrent.tips"),
  // EliteTorrent is SNI-blocked on TCP, so it is reached over HTTP/3 (QUIC).
  ELITE_TORRENT_BASE_URL: z.string().default("https://www.elitetorrent.com"),
  // Per-request timeout for EliteTorrent's HTTP/3 calls. Kept short and
  // decoupled from REQUEST_TIMEOUT_MS so a stalled QUIC request fails fast
  // (and is retried) instead of pinning the whole search for 2 minutes.
  ELITE_TORRENT_HTTP_TIMEOUT_MS: z.coerce.number().default(15_000),
  TMDB_API_KEY: z.string(),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
});

export const config = ConfigSchema.parse(process.env);
