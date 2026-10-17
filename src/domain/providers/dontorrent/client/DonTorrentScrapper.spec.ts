import { describe, it, expect, vi, afterEach } from "vitest";
import { DonTorrentScrapper } from "./DonTorrentScrapper.ts";
import type { Logger } from "../../../services/Logger.ts";
import { LoggerNoop } from "../../../services/LoggerNoop.ts";

// HTML que devuelve DonTorrent para una búsqueda sin resultados:
// el contenedor #buscador existe pero no tiene enlaces, y no hay
// paginador (nav.page-navigator). Reproduce el caso "Casanova".
const EMPTY_SEARCH_HTML = `
<html>
  <body>
    <div id="buscador">
      <p>No se han encontrado resultados.</p>
    </div>
  </body>
</html>`;

describe("DonTorrentScrapper (búsqueda sin resultados)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no debe marcar hasNext cuando no hay resultados ni paginador", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(EMPTY_SEARCH_HTML, {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
      ),
    );

    const scrapper = new DonTorrentScrapper();
    const result = await scrapper.search("Casanova");

    expect(result.items).toHaveLength(0);
    expect(result.meta.size).toBe(0);
    // BUG: hoy hasNext===true porque nav.page-navigator li:last-child es un
    // set vacío de Cheerio y .hasClass("disabled") sobre vacío es false, así
    // que !false === true → searchAll pagina hasta el infinito.
    expect(result.meta.hasNext).toBe(false);
  });
});

// A minimal page: #buscador present but empty, so search returns no items —
// enough to exercise the transport/domain plumbing without caring about parsing.
const PAGE_HTML = `<html><body><div id="buscador"></div></body></html>`;

function htmlResponse(html: string, url: string): Response {
  const response = new Response(html, {
    status: 200,
    headers: { "content-type": "text/html" },
  });
  // Response.url is read-only and empty for synthetic responses; override it to
  // simulate the final URL ky sees after following DonTorrent's domain redirect.
  Object.defineProperty(response, "url", { value: url, configurable: true });
  return response;
}

function requestedUrl(input: string | URL | Request): string {
  if (input instanceof Request) return input.url;
  return input instanceof URL ? input.href : input;
}

describe("DonTorrentScrapper (dominio dinámico + fetch inyectado)", () => {
  it("usa el fetch inyectado para las peticiones", async () => {
    const urls: string[] = [];
    const injectedFetch = vi.fn(
      async (input: string | URL | Request): Promise<Response> => {
        urls.push(requestedUrl(input));
        return htmlResponse(PAGE_HTML, requestedUrl(input));
      },
    );

    const scrapper = new DonTorrentScrapper(
      "https://dontorrent.channel",
      30_000,
      { fetch: injectedFetch },
    );
    await scrapper.search("foo");

    expect(injectedFetch).toHaveBeenCalledTimes(1);
    expect(urls[0]).toBe("https://dontorrent.channel/buscar");
  });

  it("aprende el dominio nuevo tras un 301 y enruta las siguientes peticiones a él", async () => {
    const urls: string[] = [];
    // The first request chases the 301: ky follows it, so the response URL ky
    // sees is already the new domain. The second request must go there directly.
    const injectedFetch = vi.fn(
      async (input: string | URL | Request): Promise<Response> => {
        const requested = requestedUrl(input);
        urls.push(requested);
        const finalUrl = requested.includes("dontorrent.channel")
          ? requested.replace("dontorrent.channel", "dontorrent.new")
          : requested;
        return htmlResponse(PAGE_HTML, finalUrl);
      },
    );

    const warn = vi.fn();
    const logger: Logger = Object.assign(new LoggerNoop(), {
      forClass: () => logger,
      forMethod: () => logger,
      warn,
    });

    const scrapper = new DonTorrentScrapper(
      "https://dontorrent.channel",
      30_000,
      { fetch: injectedFetch, logger },
    );

    await scrapper.search("foo");
    await scrapper.search("bar");

    expect(urls[0]).toBe("https://dontorrent.channel/buscar");
    expect(urls[1]).toBe("https://dontorrent.new/buscar");
    expect(warn).toHaveBeenCalledWith("DonTorrent domain changed", {
      from: "https://dontorrent.channel",
      to: "https://dontorrent.new",
    });
  });

  it("download() sale por el fetch inyectado", async () => {
    const urls: string[] = [];
    const injectedFetch = vi.fn(
      async (input: string | URL | Request): Promise<Response> => {
        urls.push(requestedUrl(input));
        return new Response(Buffer.from("torrent-bytes"), { status: 200 });
      },
    );

    const scrapper = new DonTorrentScrapper(
      "https://dontorrent.channel",
      30_000,
      { fetch: injectedFetch },
    );

    const bytes = await scrapper.download(
      "http://dontorrent.channel/torrents/x.torrent",
    );

    expect(injectedFetch).toHaveBeenCalledTimes(1);
    expect(urls[0]).toBe("http://dontorrent.channel/torrents/x.torrent");
    expect(bytes.toString()).toBe("torrent-bytes");
  });
});
