import { describe, it, expect } from "vitest";
import { DonTorrentOnionScrapper } from "./DonTorrentOnionScrapper.ts";
import type { DonTorrentOnionTransport } from "./DonTorrentOnionTransport.ts";

const BASE = "http://onion.onion";

// Fake transport that serves canned onion HTML per path, mirroring the real DOM
// captured over Tor (Referer-gated search, direct .torrent links, no PoW).
function transportWith(
  pages: Record<string, string>,
): DonTorrentOnionTransport {
  return {
    async text(path) {
      const html = pages[path];
      if (html === undefined) throw new Error(`no fixture for ${path}`);
      return html;
    },
    async bytes() {
      return Buffer.from("torrent-bytes");
    },
  };
}

function scrapper(pages: Record<string, string>) {
  return new DonTorrentOnionScrapper(
    BASE,
    undefined,
    30_000,
    transportWith(pages),
  );
}

// Real onion search results wrap the matched term in a nested <span> and carry
// the media type in a .badge; unsupported categories (Juego, Música) also show up.
const SEARCH_HTML = `
<div class="container"><div class="row">
  <div class="seccion" id="buscador">
    <div class="card"><div class="card-body">
      <h1 class="display-4">Resultados</h1>
      <p class="lead">Se han encontrado <b>3</b> resultados.</p>
      <p><span><a href='/pelicula/1047/X-Men-Orgenes-Lobezno' class="text-decoration-none">X-Men Orígenes: <span class="text-secondary">Lobezno</span>.</a> <span>(DVDscreener)</a></span><span class="badge badge-primary float-right">Película</span></p>
      <p><span><a href='/serie/129257/129258/Eclipse-1-Temporada' class="text-decoration-none"><span class="text-secondary">Eclipse</span> - 1ª Temporada</a> <span>(HDTV)</a></span><span class="badge badge-primary float-right">Serie</span></p>
      <p><span><a href='/juego/1989/Deep-Eclipse' class="text-decoration-none">Deep Eclipse</a></span><span class="badge badge-primary float-right">Juego</span></p>
    </div></div>
    <nav class="page-navigator"><ul class="pagination">
      <li class="page-item disabled"><a class="page-link" href="#">Anterior</a></li>
      <li class="page-item active"><a class="page-link" href="#">1</a></li>
      <li class="page-item disabled"><a class="page-link" href="#">Siguiente</a></li>
    </ul></nav>
  </div>
</div></div>`;

const EMPTY_SEARCH_HTML = `
<div class="seccion" id="buscador">
  <div class="card"><div class="card-body">
    <p class="text-center"><b>Necesitas utilizar el buscador.</b></p>
  </div></div>
</div>`;

const MOVIE_HTML = `
<h1 class="descargarTitulo">Descargar Matrix   por Torrent</h1>
<p class="m-1"><b class="bold">Año:</b> <a href="#" onclick="post('/peliculas/buscar', {campo: 'anyo', valor: '1999'});">1999</a></p>
<p class="m-1"><b class="bold">Formato:</b> HDRip</p>
<p><a class="text-white bg-primary rounded-pill" href='/torrents/peliculas/matrix-hdrip.torrent' download>Descargar</a></p>`;

const SERIES_HTML = `
<h1 class="descargarTitulo">Descargar Eclipse - 1ª Temporada por Torrent</h1>
<p class="m-1"><b class="bold">Formato:</b> HDTV</p>
<table>
  <tr><th>Episodios</th><th></th><th>Fecha</th><th>Clave</th></tr>
  <tr>
    <td style='vertical-align: middle;'>1x01</td>
    <td><a class="text-white" href='/torrents/series/Eclipse-1x01-[HDTV].torrent' download>Descargar</a></td>
    <td style='vertical-align: middle;'>2026-08-14</td>
    <td><a title="clave">clave</a></td>
  </tr>
  <tr>
    <td style='vertical-align: middle;'>1x02</td>
    <td><a class="text-white" href='/torrents/series/Eclipse-1x02-[HDTV].torrent' download>Descargar</a></td>
    <td style='vertical-align: middle;'>2026-08-15</td>
    <td><a title="clave">clave</a></td>
  </tr>
</table>`;

describe("DonTorrentOnionScrapper", () => {
  it("parses search results and skips unsupported categories", async () => {
    const s = scrapper({ "/buscar/Lobezno": SEARCH_HTML });
    const result = await s.search("Lobezno");

    // The Juego hit is dropped; only the movie and the series remain.
    expect(result.items).toHaveLength(2);
    expect(result.items[0].path).toBe("/pelicula/1047/X-Men-Orgenes-Lobezno");
    expect(result.items[0].name).toBe("X-Men Orígenes: Lobezno.");
    expect(result.items[0].isMovie()).toBe(true);
    expect(result.items[1].isTVShow()).toBe(true);
  });

  it("url-encodes the query and reports no next page on the last page", async () => {
    const s = scrapper({ "/buscar/X-Men%20Lobezno": SEARCH_HTML });
    const result = await s.search("X-Men Lobezno");

    expect(result.items).toHaveLength(2);
    // Last-child pagination item ("Siguiente") is disabled -> no next page.
    expect(result.meta.hasNext).toBe(false);
  });

  it("paginates through /page/<n> for pages beyond the first", async () => {
    const s = scrapper({ "/buscar/Lobezno/page/2": SEARCH_HTML });
    const result = await s.search("Lobezno", 1);
    expect(result.items).toHaveLength(2);
  });

  it("does not mark hasNext when the search is empty", async () => {
    const s = scrapper({ "/buscar/Casanova": EMPTY_SEARCH_HTML });
    const result = await s.search("Casanova");

    expect(result.items).toHaveLength(0);
    expect(result.meta.size).toBe(0);
    expect(result.meta.hasNext).toBe(false);
  });

  it("extracts the direct .torrent path, year and format from a movie page", async () => {
    const s = scrapper({ "/pelicula/970/Matrix": MOVIE_HTML });
    const meta = await s.getMovieMetadata("/pelicula/970/Matrix");

    expect(meta.table).toBe("/torrents/peliculas/matrix-hdrip.torrent");
    expect(meta.year).toBe(1999);
    expect(meta.format).toBe("HDRip");
    expect(meta.title).toBe("Matrix");
  });

  it("builds an absolute onion URL from the scraped torrent path", async () => {
    const s = scrapper({});
    const url = await s.contentToUrl(
      0,
      "/torrents/peliculas/matrix-hdrip.torrent",
    );
    expect(url).toBe(`${BASE}/torrents/peliculas/matrix-hdrip.torrent`);
  });

  it("extracts every episode's direct .torrent link from a series page", async () => {
    const s = scrapper({ "/serie/1/1/Eclipse": SERIES_HTML });
    const show = await s.getShowSeasonMetadata("/serie/1/1/Eclipse");

    expect(show.format).toBe("HDTV");
    expect(show.episodes).toHaveLength(2);
    expect(show.episodes[0].title).toBe("1x01");
    expect(show.episodes[0].table).toBe(
      "/torrents/series/Eclipse-1x01-[HDTV].torrent",
    );
    expect(show.episodes[0].date).toBe("2026-08-14");
    expect(show.episodes[1].title).toBe("1x02");
  });
});
