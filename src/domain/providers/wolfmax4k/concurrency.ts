/**
 * Max concurrent HTTP/3 torrent resolutions per search.
 *
 * Resolving every edition at once (a movie like "Ángeles y demonios" has ~25)
 * bursts the QUIC fan-out and triggers quico's cold-session fragility. Capping
 * it keeps the burst small so requests stay fast and the session stays healthy.
 */
export const WOLFMAX4K_RESOLVE_CONCURRENCY = 6;
