import { describe, it, expect, vi, afterEach } from "vitest";
import { DonTorrentScrapper } from "./DonTorrentScrapper.ts";

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
