import { ProxyAgent, type Dispatcher } from "undici";

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
