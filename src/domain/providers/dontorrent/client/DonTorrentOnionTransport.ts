import { fetch, ProxyAgent, type Dispatcher } from "undici";

/**
 * HTTP transport used to reach DonTorrent's Tor (.onion) service.
 *
 * DonTorrent's clearnet is SNI-blocked at the ISP level from production (a TLS
 * reset on the ClientHello, ECONNRESET on every mirror domain). Tor is encrypted
 * end to end, so the ISP cannot filter it, and the .onion address never rotates.
 * Reaching a .onion requires a Tor proxy: we point undici's ProxyAgent at Tor's
 * HTTPTunnelPort (an HTTP CONNECT proxy) and let Tor resolve the onion host
 * internally — no `socks-proxy-agent`, no extra dependency.
 */
export interface DonTorrentOnionTransport {
  /**
   * GET an onion path (or absolute onion URL) and return the body as text.
   *
   * `referer` is sent as the Referer header. The onion search endpoint is
   * hotlink-gated: without a Referer it returns an empty page ("Necesitas
   * utilizar el buscador") instead of results.
   */
  text(pathOrUrl: string, referer?: string): Promise<string>;

  /**
   * GET an onion path (or absolute onion URL) and return the raw bytes. Used for
   * .torrent downloads, which need no Referer.
   */
  bytes(pathOrUrl: string): Promise<Buffer>;
}

export class UndiciTorTransport implements DonTorrentOnionTransport {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeout: number;
  private readonly torProxyUrl: string | undefined;
  private readonly retries: number;
  private dispatcher: Dispatcher | undefined;

  constructor(
    baseUrl: string,
    torProxyUrl?: string,
    timeout = 30_000,
    userAgent = "Mozilla/5.0",
    retries = 2,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
    this.userAgent = userAgent;
    this.torProxyUrl = torProxyUrl;
    this.retries = retries;
    this.dispatcher = this.createDispatcher();
  }

  private createDispatcher(): Dispatcher | undefined {
    return this.torProxyUrl ? new ProxyAgent(this.torProxyUrl) : undefined;
  }

  /**
   * Tor CONNECT tunnels go stale between requests: an idle pooled tunnel is
   * dropped and the next request fails with UND_ERR_SOCKET ("other side closed")
   * or a timeout — the same failure mode wolfmax's QUIC pool has. Tearing down
   * the ProxyAgent forces the retry to dial a fresh tunnel (and often a fresh,
   * faster circuit).
   */
  private recycle(): void {
    this.dispatcher?.destroy?.();
    this.dispatcher = this.createDispatcher();
  }

  private resolve(pathOrUrl: string): string {
    return pathOrUrl.startsWith("http") ? pathOrUrl : this.baseUrl + pathOrUrl;
  }

  private async request<T>(
    pathOrUrl: string,
    headers: Record<string, string>,
    read: (response: Awaited<ReturnType<typeof fetch>>) => Promise<T>,
  ): Promise<T> {
    const url = this.resolve(pathOrUrl);
    let lastError: unknown;

    // The body is read inside the retry: a stale tunnel can also close midway
    // through streaming, so a fresh attempt must re-issue the whole request.
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": this.userAgent, ...headers },
          signal: AbortSignal.timeout(this.timeout),
          dispatcher: this.dispatcher,
        });
        if (!response.ok) {
          throw new Error(
            `DonTorrent onion request failed: ${response.status} for ${pathOrUrl}`,
          );
        }
        return await read(response);
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          this.recycle();
        }
      }
    }

    throw lastError;
  }

  async text(pathOrUrl: string, referer?: string): Promise<string> {
    return this.request(
      pathOrUrl,
      referer ? { Referer: referer } : {},
      (response) => response.text(),
    );
  }

  async bytes(pathOrUrl: string): Promise<Buffer> {
    return this.request(pathOrUrl, {}, async (response) =>
      Buffer.from(await response.arrayBuffer()),
    );
  }
}
