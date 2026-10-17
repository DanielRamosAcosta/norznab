import { ProxyAgent, type Dispatcher } from "undici";

/**
 * A `fetch`-compatible function that routes requests through a Tor HTTP proxy.
 *
 * DonTorrent's clearnet is SNI-blocked at the ISP level (a TLS reset on the
 * ClientHello, ECONNRESET on every mirror). Sending the request through a Tor
 * exit node dodges the block: Tor only encrypts the local leg the ISP can see,
 * and the exit node fetches the ordinary `https://dontorrent.*` site for us.
 * This is NOT the `.onion` route — it is plain clearnet carried over Tor.
 *
 * Injected into {@link DonTorrentScrapper}'s `ky` instance (and reused by its
 * `download()`), so the whole DonTorrent flow — search, proof-of-work, torrent
 * download — travels over Tor while every other provider keeps using the global
 * dispatcher.
 */
export type TorFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function createTorFetch(
  torProxyUrl: string,
  timeout = 30_000,
  retries = 2,
): TorFetch {
  let dispatcher: Dispatcher = new ProxyAgent(torProxyUrl);

  // Tor CONNECT tunnels go stale between requests: an idle pooled tunnel is
  // dropped and the next request fails with UND_ERR_SOCKET ("other side
  // closed") or a timeout. Tearing down the ProxyAgent forces the retry to dial
  // a fresh tunnel (and often a fresh, faster circuit). Same failure mode and
  // fix as UndiciTorTransport.
  const recycle = (): void => {
    dispatcher.destroy?.();
    dispatcher = new ProxyAgent(torProxyUrl);
  };

  return async (input, init) => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // `dispatcher` is an undici extension to RequestInit; the global
        // (DOM) RequestInit type doesn't declare it, so widen through a typed
        // variable rather than casting. Node's global fetch is undici, so it
        // honours the dispatcher at runtime.
        // Per-attempt timeout so a stalled tunnel fails fast and the retry gets
        // a fresh circuit, instead of hanging until the caller's overall timeout.
        // Combined with the caller's signal (ky's own timeout) so either aborts.
        const signals = [AbortSignal.timeout(timeout)];
        if (init?.signal) {
          signals.push(init.signal);
        }
        const requestInit: RequestInit & { dispatcher: Dispatcher } = {
          ...init,
          dispatcher,
          signal: AbortSignal.any(signals),
        };
        return await fetch(input, requestInit);
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          recycle();
        }
      }
    }

    throw lastError;
  };
}
