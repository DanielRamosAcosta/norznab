import quico from "quico";

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

  constructor(timeout = 30_000) {
    this.timeout = timeout;
  }

  send(options: Http3RequestOptions): Promise<Http3Response> {
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
          method: options.method ?? "GET",
          headers,
        },
        (res) => {
          res.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
          res.on("end", () => {
            clearTimeout(timer);
            resolve({
              status: res.statusCode ?? 0,
              httpVersion: res.httpVersion,
              headers: res.headers,
              body: Buffer.concat(chunks),
            });
          });
          res.on("error", onError);
        },
      );

      const onError = (error: Error) => {
        clearTimeout(timer);
        reject(error);
      };

      const timer = setTimeout(() => {
        req.abort();
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
