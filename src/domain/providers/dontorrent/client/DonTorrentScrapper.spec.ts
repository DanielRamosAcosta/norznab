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

// HTML que devuelve DonTorrent para una búsqueda con resultados. Cada
// resultado es un li.search-result con el enlace en a.search-result-link,
// la categoría en el span.badge hermano del contenido y la calidad en
// span.search-result-format. El nombre del enlace trae un punto final.
const SEARCH_RESULTS_HTML = `
<html>
  <body>
    <div id="buscador">
      <div class="card"><div class="card-body" id="search-results">
        <ul class="search-results list-unstyled">
          <li class="search-result">
            <span class="search-result-content">
              <a href="/pelicula/20501/Bohemian-Rhapsody" class="search-result-link"><span>Bohemian</span> <span>Rhapsody</span>.</a>
              <span class="search-result-format">(BDremux-1080p)</span>
            </span>
            <span class="badge badge-primary">Película</span>
          </li>
          <li class="search-result">
            <span class="search-result-content">
              <a href="/serie/886/Breaking-Bad-1-Temporada" class="search-result-link">Breaking Bad 1ª Temporada</a>
              <span class="search-result-format">(HDTV)</span>
            </span>
            <span class="badge badge-primary">Serie</span>
          </li>
        </ul>
      </div></div>
    </div>
  </body>
</html>`;

describe("DonTorrentScrapper (búsqueda con resultados)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("extrae enlace, nombre y tipo de cada li.search-result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(SEARCH_RESULTS_HTML, {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
      ),
    );

    const scrapper = new DonTorrentScrapper();
    const result = await scrapper.search("bohemian rhapsody");

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      path: "/pelicula/20501/Bohemian-Rhapsody",
      name: "Bohemian Rhapsody",
      type: "Película",
    });
    expect(result.items[1]).toMatchObject({
      path: "/serie/886/Breaking-Bad-1-Temporada",
      name: "Breaking Bad 1ª Temporada",
      type: "Serie",
    });
  });

  it("marca hasNext cuando el paginador ofrece página siguiente", async () => {
    const html = SEARCH_RESULTS_HTML.replace(
      "</div>\n    </div>\n  </body>",
      `</div>
      <nav class="page-navigator">
        <ul class="pagination">
          <li class="page-item active"><span class="page-link">1</span></li>
          <li class="page-item">
            <button class="page-link" name="p" value="2" aria-label="Página siguiente"></button>
          </li>
        </ul>
      </nav>
    </div>
  </body>`,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(html, {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
      ),
    );

    const scrapper = new DonTorrentScrapper();
    const result = await scrapper.search("the");

    expect(result.meta.hasNext).toBe(true);
  });
});

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

const PAGE_HTML = `<html><body><div id="buscador"></div></body></html>`;

function htmlResponse(html: string, url: string): Response {
  const response = new Response(html, {
    status: 200,
    headers: { "content-type": "text/html" },
  });
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
