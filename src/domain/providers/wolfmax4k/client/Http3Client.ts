import quico from "quico";
import type { Logger } from "../../../services/Logger.ts";
import { LoggerNoop } from "../../../services/LoggerNoop.ts";

export interface Http3Response {
  status: number;
  httpVersion: string;
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}

export interface Http3RequestOptions {
  hostname: string;
  path: string;
  method?: string;
  headers?: Record<string, string | number>;
  body?: string | Buffer;
}

/**
 * HTTP client abstraction used to reach wolfmax4k over HTTP/3 (QUIC).
 *
 * wolfmax4k is blocked at the ISP level via plaintext-SNI DPI on TCP, which
 * resets any TLS handshake to that domain. QUIC (UDP/443) is not affected, so
 * we speak HTTP/3 to bypass the block without a browser or curl.
 */
export interface Http3Client {
  send(options: Http3RequestOptions): Promise<Http3Response>;
}

export class QuicoHttp3Client implements Http3Client {
  private readonly timeout: number;
  private readonly retries: number;
  private readonly logger: Logger;
  private static counter = 0;

  constructor(
    timeout = 15_000,
    logger: Logger = new LoggerNoop(),
    retries = 2,
  ) {
    this.timeout = timeout;
    this.retries = retries;
    this.logger = logger.forClass(QuicoHttp3Client.name);
  }

  async send(options: Http3RequestOptions): Promise<Http3Response> {
    const id = ++QuicoHttp3Client.counter;
    let lastError: unknown;

    // quico's QUIC session to Cloudflare is fragile when cold / under fan-out
    // ("All protocols failed", multi-second stalls); a bounded retry recovers.
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        return await this.attempt(options, id, attempt);
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          this.logger.warn("h3 request retry", {
            id,
            attempt,
            err: error instanceof Error ? error.message : String(error),
          });
          await delay(250 * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  private attempt(
    options: Http3RequestOptions,
    id: number,
    attempt: number,
  ): Promise<Http3Response> {
    const method = options.method ?? "GET";
    const startedAt = Date.now();
    const meta = {
      id,
      attempt,
      method,
      host: options.hostname,
      path: options.path,
    };
    this.logger.debug("h3 request →", meta);

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      const headers = Object.fromEntries(
        Object.entries(options.headers ?? {}).map(([key, value]) => [
          key,
          String(value),
        ]),
      );

      const req = quico.request(
        {
          hostname: options.hostname,
          path: options.path,
          method,
          headers,
        },
        (res) => {
          res.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          res.on("end", () => {
            clearTimeout(timer);
            const body = Buffer.concat(chunks);
            this.logger.debug("h3 request ←", {
              ...meta,
              status: res.statusCode,
              httpVersion: res.httpVersion,
              bytes: body.length,
              ms: Date.now() - startedAt,
            });
            resolve({
              status: res.statusCode ?? 0,
              httpVersion: res.httpVersion,
              headers: res.headers,
              body,
            });
          });
          res.on("error", onError);
        },
      );

      const onError = (error: Error) => {
        clearTimeout(timer);
        this.logger.debug("h3 request ✗", {
          ...meta,
          ms: Date.now() - startedAt,
          err: error.message,
        });
        reject(error);
      };

      const timer = setTimeout(() => {
        req.abort();
        this.logger.warn("h3 request timed out", {
          ...meta,
          ms: Date.now() - startedAt,
        });
        reject(new Error(`HTTP/3 request timed out after ${this.timeout}ms`));
      }, this.timeout);

      req.on("error", onError);

      if (options.body !== undefined) {
        req.write(options.body);
      }
      req.end();
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
