import { ProxyAgent, type Dispatcher } from "undici";

export type TorFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface TorFetchOptions {
  timeout?: number;
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
}

// Cloudflare in front of DonTorrent rate-limits a single Tor exit node when
// searchAll fires several POSTs down the same keep-alive circuit. The 429 (and
// an overloaded 503) clear as soon as we leave through a different exit, so both
// are treated as retryable: recycling the ProxyAgent forces a fresh circuit.
const RETRYABLE_STATUS = new Set([429, 503]);
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {
    return seconds * 1_000;
  }
  const date = Date.parse(header);
  if (Number.isFinite(date)) {
    return Math.max(0, date - Date.now());
  }
  return undefined;
}

function backoffFor(attempt: number, response?: Response): number {
  const retryAfter = response
    ? parseRetryAfter(response.headers.get("retry-after"))
    : undefined;
  const exponential = Math.min(
    BASE_BACKOFF_MS * 2 ** attempt,
    MAX_BACKOFF_MS,
  );
  return Math.max(retryAfter ?? 0, exponential);
}

export function createTorFetch(
  torProxyUrl: string,
  timeout = 30_000,
  options: TorFetchOptions = {},
): TorFetch {
  const retries = options.retries ?? 3;
  const sleep = options.sleep ?? defaultSleep;
  let dispatcher: Dispatcher = new ProxyAgent(torProxyUrl);

  // A stale Tor CONNECT tunnel fails with UND_ERR_SOCKET, and a sticky exit node
  // gets rate-limited — tearing down the ProxyAgent fixes both by dialing a
  // fresh tunnel through a (usually) different circuit.
  const recycle = (): void => {
    dispatcher.destroy?.();
    dispatcher = new ProxyAgent(torProxyUrl);
  };

  return async (input, init) => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const signals = [AbortSignal.timeout(timeout)];
        if (init?.signal) {
          signals.push(init.signal);
        }
        const requestInit: RequestInit & { dispatcher: Dispatcher } = {
          ...init,
          dispatcher,
          signal: AbortSignal.any(signals),
        };
        const response = await fetch(input, requestInit);

        if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
          await sleep(backoffFor(attempt, response));
          recycle();
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await sleep(backoffFor(attempt));
          recycle();
        }
      }
    }

    throw lastError;
  };
}
