import z from "zod";

const boolFromEnvDefaultFalse = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

export const ConfigSchema = z.object({
  DON_TORRENT_BASE_URL: z.string(),
  // DonTorrent clearnet is SNI-blocked from production. The robust path is to
  // reach the CLEARNET site through a Tor exit node (the circuit dodges the
  // ISP's local DPI): DON_TORRENT_USE_TOR routes the normal clearnet scrapper
  // over the Tor HTTP proxy at DON_TORRENT_TOR_PROXY. Preferred over the .onion
  // route below, whose hidden service is currently dead (HSDir unreachable).
  DON_TORRENT_USE_TOR: boolFromEnvDefaultFalse,
  // Legacy: reach DonTorrent's Tor (.onion) hidden service instead. Kept but
  // dormant — the onion descriptor is not published anymore, so it resolves to
  // nothing. Requires the same DON_TORRENT_TOR_PROXY.
  DON_TORRENT_USE_ONION: boolFromEnvDefaultFalse,
  DON_TORRENT_ONION_URL: z
    .string()
    .default(
      "http://dontorufwmbqhnoe2wvko5ynis6axf7bqod6wkmdvxmjyek64tantlqd.onion",
    ),
  DON_TORRENT_TOR_PROXY: z.string().default(""),
  MARCIANO_TORRENT_BASE_URL: z.string(),
  // EliteTorrent is SNI-blocked on TCP like wolfmax; reached over HTTP/3.
  ELITE_TORRENT_BASE_URL: z.string().default("https://www.elitetorrent.com"),
  WOLFMAX4K_BASE_URL: z.string().default("https://wolfmax4k.com"),
  // Per-request timeout for wolfmax HTTP/3 + enlacito calls. Kept short and
  // decoupled from REQUEST_TIMEOUT_MS so a stalled QUIC request fails fast
  // (and is retried) instead of pinning the whole search for 2 minutes.
  WOLFMAX4K_HTTP_TIMEOUT_MS: z.coerce.number().default(15_000),
  TMDB_API_KEY: z.string(),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
});

export const config = ConfigSchema.parse(process.env);
