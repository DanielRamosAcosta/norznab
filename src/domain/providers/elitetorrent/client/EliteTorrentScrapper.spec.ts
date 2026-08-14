import { describe, it, expect } from "vitest";
import { EliteTorrentScrapper } from "./EliteTorrentScrapper.ts";
import type {
  Http3Client,
  Http3RequestOptions,
  Http3Response,
} from "../../http3/Http3Client.ts";

// base64 x5 (ROT13(...)) of a magnet with a `dn`, as served in the ad-gate link.
const MAGNET_TOKEN =
  "VjJ4amQwMVZNVWRpUm14VVlsUldVVmxYY0hObFZtUjFZak5vYVUxWVFsbFZiRkpoWVZVeGRGVlliR0ZTYkVveldrWmtTbVZzUm5WaFIzQnBZWHBGZWxaR1dsTlRiVlp5VGxWV1YxWkZjRkJhVnpGcVRWWk9kRTFFUms5aVIzY3lXa1ZvYjFkc1drVlNiV2hhWWxSR2NsbHJaRk5rUjAxNlUydDBWMUpYYzNkV2JYaGhVakZLZEZWdVVsVldNMmhQV1ZjeE1HVldUbk5WYTNCUFVteGFNVmxyVWt0WlZUQjNZMFZzV0ZaNlJsaFphMlJQWkVaS2RFNVZNV2xXVm04eFZqSTFjMVp0VmxaUFZrcFJWa1JCT1E9PQ==";

const SEARCH_HTML = `
<div class="pelicula">
  <div class="imagen"><a href="https://www.elitetorrent.com/peliculas/matrix-hdrip-bittorrent-hd-1/" title="Matrix (HDRip)"><img src="x"></a></div>
  <div class="meta"><a href="https://www.elitetorrent.com/peliculas/matrix-hdrip-bittorrent-hd-1/" title="Matrix ">Matrix</a></div>
</div>
<div class="pelicula">
  <div class="imagen"><a href="/peliculas/matrix-reloaded-hdrip/" title="Matrix Reloaded (HDRip)"><img src="x"></a></div>
</div>
<nav><a href="/serie/" title="series torrent">Series</a></nav>`;

const DETAIL_HTML = `
<h1>Descargar matrix  por torrent</h1>
<div class="ficha_datos">
  <p><b>Tamaño</b>: 2 GBs</p>
  <p><b>Fecha</b>: 28-07-2013</p>
</div>
<div class="ficha_descarga_opciones">
  <a href="https://acortame-esto.com/s.php?i=${MAGNET_TOKEN}" rel="nofollow" class="enlace_torrent degradado1">Descargar por magnet link</a>
</div>`;

const NO_DOWNLOAD_HTML = `<h1>Descargar algo por torrent</h1><p>Próximamente</p>`;

function fakeHttp(pages: Record<string, string>): Http3Client {
  return {
    async send(options: Http3RequestOptions): Promise<Http3Response> {
      const html = pages[options.path];
      if (html === undefined) throw new Error(`no fixture for ${options.path}`);
      return {
        status: 200,
        httpVersion: "3",
        headers: {},
        body: Buffer.from(html, "utf8"),
      };
    },
  };
}

function scrapper(pages: Record<string, string>) {
  return new EliteTorrentScrapper(
    "https://www.elitetorrent.com",
    15_000,
    fakeHttp(pages),
  );
}

describe("EliteTorrentScrapper", () => {
  it("parses the results grid, deduping the poster/meta pair", async () => {
    const s = scrapper({ "/?s=matrix": SEARCH_HTML });
    const results = await s.search("matrix");

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      path: "/peliculas/matrix-hdrip-bittorrent-hd-1/",
      title: "Matrix (HDRip)",
    });
    expect(results[1].path).toBe("/peliculas/matrix-reloaded-hdrip/");
  });

  it("decodes the ad-gate token to a magnet and reads size and date", async () => {
    const s = scrapper({
      "/peliculas/matrix-hdrip-bittorrent-hd-1/": DETAIL_HTML,
    });
    const release = await s.getRelease(
      "/peliculas/matrix-hdrip-bittorrent-hd-1/",
    );

    expect(release).not.toBeNull();
    expect(release?.magnet).toMatch(
      /^magnet:\?xt=urn:btih:abcdef0123456789&dn=/,
    );
    // dn is used as the release name, with the site tag stripped.
    expect(release?.name).toBe("Matrix (HDRip)");
    expect(release?.size).toBe(2 * 1024 ** 3);
    expect(release?.pubDate).toContain("28 Jul 2013");
  });

  it("returns null for a detail page with no download", async () => {
    const s = scrapper({ "/peliculas/x/": NO_DOWNLOAD_HTML });
    expect(await s.getRelease("/peliculas/x/")).toBeNull();
  });
});
