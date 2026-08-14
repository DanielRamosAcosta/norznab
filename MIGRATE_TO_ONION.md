# MIGRATE_TO_ONION — Handoff para migrar DonTorrent a su servicio .onion (Tor)

> Documento de traspaso entre sesiones de Claude Code. Léelo entero antes de
> tocar nada. Explica **qué** queremos, **cómo trabajamos**, **qué hemos
> descubierto ya** y **qué falta**.

## ESTADO (actualizado) — código hecho, falta infra + deploy

El **nudo bloqueante está resuelto** y el **código del provider onion está
implementado y verificado empíricamente** (search → metadata → descarga de un
`.torrent` real, en vivo por Tor, caso `X-Men orígenes: Lobezno` → 3 ediciones).

- **El "vacío" de la búsqueda era el `Referer`.** `GET /buscar/<query>` sin
  cabecera `Referer` al propio onion devuelve "Necesitas utilizar el buscador"
  (hotlink-gate). CON `Referer` devuelve resultados. El DOM de resultados es
  **igual al clearnet** (`#buscador p a` + `.badge` + `nav.page-navigator`); la
  confusión del doc (doble-id) venía de las cards de la home, no de la búsqueda.
- **Descarga: `.torrent` DIRECTO, sin PoW.** La página de detalle trae
  `<a href="/torrents/....torrent" download>`. Series: un `.torrent` por fila de
  la tabla de episodios. No hay `api_validate_pow.php` en el onion.
- **Transporte: cero deps nuevas.** undici `ProxyAgent("http://host:puerto")` +
  Tor con `HTTPTunnelPort` (Tor resuelve el `.onion` internamente).

Implementado en el repo (rama `fix/dontorrent-dropped-editions`):

- `client/DonTorrentOnionScrapper.ts` — implementa la interfaz `DonTorrent`
  (adapters SIN cambios); el path del `.torrent` viaja en `table` y
  `contentToUrl` lo vuelve URL absoluta.
- `client/DonTorrentOnionTransport.ts` — transporte undici+Tor inyectable.
- `client/DonTorrentOnionScrapper.spec.ts` — 7 tests de parsing (verde).
- `config.ts` — `DON_TORRENT_USE_ONION` (default false), `DON_TORRENT_ONION_URL`
  (default = el onion), `DON_TORRENT_TOR_PROXY`.
- `container.ts` — si `USE_ONION` → cablea el onion scrapper en vez del clearnet.

**Falta (necesita OK del usuario / infra):** (3) montar un **Tor proxy** en el
clúster (nas-k3s, ns `arr`) con `HTTPTunnelPort` y apuntar norznab a él vía
`DON_TORRENT_TOR_PROXY` + `DON_TORRENT_USE_ONION=true`; (6) desplegar y
**verificar en prod**. Local dev/tests siguen en clearnet (flag off por defecto).

## 0) Objetivo

Migrar el provider **DonTorrent** de norznab para que use su **servicio Tor
(.onion)** en vez del clearnet. Motivos:

1. **El clearnet de DonTorrent está SNI-bloqueado** desde la red del pod de
   producción (el ISP resetea el TCP en _todos_ los dominios: `dontorrent.review`,
   `.management`, `.promo`, `.com` → `ECONNRESET`). DonTorrent usa `ky` (TCP), así
   que **ahora mismo no funciona nada de DonTorrent en prod**.
2. Usar el **onion** evita el bloqueo (Tor va cifrado, el ISP no puede filtrar por
   SNI) **y** evita tener que ir **rotando el dominio** cada vez que cae.

> Alternativa descartada por el usuario (de momento): portar DonTorrent a HTTP/3
> (quico), como se hizo con wolfmax. Es más pequeño (mismo scrapper, solo cambia
> el transporte, `dontorrent.management` responde 200 por h3 desde el pod), pero
> obliga a rotar dominio. El usuario prefiere insistir con el onion.

---

## 1) CÓMO TRABAJAMOS (importante — respétalo)

- **NADA de afirmaciones sin evidencia empírica.** Cada hipótesis se **prueba**
  con un test real antes de darla por buena. En este proyecto, inferir sin probar
  nos llevó a diagnósticos equivocados **dos veces** (ver memoria
  `always-empirical-evidence`). Si crees que "es X", **demuéstralo** (entra al
  pod, prueba la conectividad, reproduce el flujo real, enseña los números).
- **Reproduce en el entorno REAL (el pod), no solo en local.** El comportamiento
  difiere: el clearnet está SNI-bloqueado desde el pod pero no desde el Mac; quico
  se degrada por ociosidad solo en el proceso de larga vida; etc.
- **Prod deploys → requieren OK del usuario.** No mergees a prod sin luz verde.
- **Convenciones de código**: ver `CLAUDE.md` (imports con `.ts`, `import type`,
  Zod `.strict()`, **nunca `as any`**, Node 24 corre TS nativo — `node file.ts`).
- Tests: `*.spec.ts` = unitarios (`npm run test:unitary`), `npm run typecheck`,
  `npm run format`. Añade tests de regresión para lo que arregles.
- Commits: mensaje convencional; PR por rama; deja que el usuario revise el diff.

---

## 2) DE DÓNDE VENIMOS (contexto)

**norznab** es un indexer Torznab para \*arr (Radarr/Sonarr). Providers:
DonTorrent, MarcianoTorrent, **wolfmax4k** (añadido hace poco).

- **wolfmax4k** se integró sobre **HTTP/3 (quico)** porque está SNI-bloqueado en
  TCP. Hay un `Http3Client` que envuelve `quico` en
  `src/domain/providers/wolfmax4k/client/Http3Client.ts`.
  - Gotcha 1: quico necesita `await require('quico').ready` antes de usarse (el
    `import quico from "quico"` ESM lo maneja).
  - Gotcha 2 (ya arreglado): las conexiones QUIC de quico **mueren por ociosidad**
    (NAT/UDP idle timeout ~150s) y quico reutiliza el socket muerto → todo se
    estanca. Solución: reciclar con `quico.globalAgent.destroy()` (proactivo si
    ocioso >30s + reactivo en timeout). Ver `Http3Client.ts`.
- **DonTorrent** ahora **también** está SNI-bloqueado en el pod (descubierto al
  investigar por qué "X-Men orígenes: Lobezno" no salía). Detalles abajo.
- **Estado desplegado actual**: `main-0713f4a` (namespace `arr`). Incluye:
  wolfmax e2e, fix de reciclado quico, dominio DonTorrent por defecto
  `dontorrent.management`, y un fix de resiliencia de DonTorrent
  (`DonTorrentMovieAdapter.extractMovie` ahora tiene try/catch por-item para que
  una edición con formato no mapeado no tumbe toda la búsqueda; + se mapeó el
  formato `DVDscreener`). Ese fix es válido pero **no** resuelve el bloqueo SNI.

Memorias relevantes (en el dir de memoria de la sesión):
`always-empirical-evidence`, `norznab-wolfmax-source`.

---

## 3) QUÉ HEMOS DESCUBIERTO DEL ONION (evidencia empírica)

**Dirección .onion:**
`http://dontorufwmbqhnoe2wvko5ynis6axf7bqod6wkmdvxmjyek64tantlqd.onion/`
(sacada de https://dontorrent.blog/guia-dontorrent-tor/ ; short link `tor.cat`)

Probado con un Tor local (`nix shell nixpkgs#tor` + `curl --socks5-hostname`):

- **Alcanzable**: `GET /` → HTTP 200, ~2.3s, ~40KB. Title `... DonTorrent Tor`.
- **Estructura DISTINTA al clearnet** (es otra base de código / otro layout):
  - Buscador: el form `#search` (action="/") tiene JS que hace
    `window.location.replace("/buscar/" + query)` → **la búsqueda es
    `GET /buscar/<query>`** (query crudo en el path, url-encoded). NO es el
    `POST /buscar` con `valor=` del clearnet.
  - Enlaces de contenido: `/serie/<id>/<id>/<nombre>` (doble id); presumiblemente
    `/pelicula/<id>/<id>/<nombre>`. El clearnet usa `/pelicula/<id>/<nombre>`.
  - Hay otros forms (`POST /` con `sec=buscador` → devuelve el home, ignóralo;
    `POST /peliculas/buscar`).
- **PROBLEMA A RESOLVER (lo primero):** `GET /buscar/<query>` devuelve 200 con un
  contenedor `<div class="list-group torrents-list shadow-sm">` pero **VACÍO** en
  mis pruebas (probé "Lobezno" y "X-Men orígenes: Lobezno" → 0 items), aunque el
  clearnet da muchos. No detecté AJAX/fetch en el HTML. Hay que averiguar por qué:
  ¿render por JS?, ¿necesita cookie/cabecera/referer?, ¿formato de query distinto
  (guiones en vez de espacios)?, ¿artefacto del circuito Tor / rate-limit?, ¿otro
  endpoint? **Ese es el primer nudo a desatar.**
- El scrapper clearnet actual
  (`src/domain/providers/dontorrent/client/DonTorrentScrapper.ts`) parsea
  `#buscador p a`, `nav.page-navigator`, etc. — el onion tiene otro DOM y
  necesitará **parsing nuevo**. Ojo también al **flujo de descarga**: el clearnet
  hace un **proof-of-work** (`api_validate_pow.php`, SHA-256) para obtener la URL
  del `.torrent`. Hay que ver si el onion usa lo mismo o enlaces `.torrent`
  directos.

---

## 4) TAREAS (qué falta por hacer)

1. **Crackear la búsqueda del onion** (bloqueante): reproducir `GET /buscar/<q>`
   por Tor y descubrir cómo se cargan de verdad los resultados (HTML estático vs
   JS vs otro endpoint vs cabeceras/cookies). Empieza con una query con
   resultados garantizados y compara con el clearnet.
2. **Mapear toda la estructura onion**: parsing de resultados (tipo peli/serie,
   path, nombre), página de detalle, y **mecanismo de descarga** (¿PoW como el
   clearnet? ¿`.torrent` directo? ¿magnet?).
3. **Acceso a Tor desde el clúster**: montar un **Tor proxy** (sidecar/deployment
   en `nas-k3s`, namespace `arr`) y hacer que norznab enrute DonTorrent por él.
   Opciones: SOCKS5 con `undici` + `socks-proxy-agent` (dispatcher), o Tor con
   `HTTPTunnelPort` + `undici ProxyAgent`. Decide la más limpia y con menos deps.
4. **Scrapper onion** para DonTorrent (nuevo, o adaptar el existente) detrás de la
   **misma interfaz** `DonTorrent` (`client/DonTorrent.ts`), para que los adapters
   no cambien. Reutiliza el patrón de wolfmax (interfaz de transporte inyectable +
   parsing con cheerio).
5. **Config/wiring**: dirección onion + endpoint del proxy Tor en `config.ts` y
   `container.ts`. Decide si el onion **reemplaza** al clearnet o convive como
   fallback.
6. **Probar en el pod (empíricamente)** y **desplegar** vía el flujo de siempre,
   y **verificar** que una búsqueda real (p.ej. tmdbid 2080 = "X-Men orígenes:
   Lobezno", que el clearnet resuelve a 3 ediciones) **devuelve resultados** en
   prod. Añade tests de parsing del onion.

Caso de prueba de referencia (clearnet, para comparar): TMDB `2080` → título
es-ES `"X-Men orígenes: Lobezno"` → en `dontorrent.management` da 3 ediciones
(`/pelicula/19051` BDremux-1080p, `/pelicula/1047` DVDscreener, `/pelicula/8701`
MicroHD-1080p).

---

## 5) CÓMO PROBAR EL ONION (recetas)

**Tor local (Mac):**

```sh
nix shell nixpkgs#tor -c sh -c '
  DATA=$(mktemp -d)
  tor --SocksPort 9050 --DataDirectory "$DATA" --Log "notice stdout" > /tmp/tor.log 2>&1 &
  for i in $(seq 1 45); do grep -q "Bootstrapped 100" /tmp/tor.log && break; sleep 2; done
  ONION="http://dontorufwmbqhnoe2wvko5ynis6axf7bqod6wkmdvxmjyek64tantlqd.onion"
  curl -s --socks5-hostname 127.0.0.1:9050 "$ONION/buscar/Lobezno" -A "Mozilla/5.0" --max-time 90
'
```

**Entorno real = el pod** (`kubectl -n arr ...`):

- Tengo acceso a `kubectl` (contexto `default`). El pod es `deploy/norznab` en ns
  `arr`. Node + quico están en `/app/node_modules`; el código en `/app/src`.
- Reproducir código real de norznab en el pod:
  `kubectl exec -i -n arr deploy/norznab -- node --input-type=module < script.mjs`
  (importa `/app/src/...ts`; usa `import(...)`).
- Ojo: el clasificador de seguridad **bloquea** `kubectl exec` que vuelque
  secretos (p.ej. `printenv TMDB_API_KEY`). No lo hagas; ejecuta el cliente TMDB
  dentro del pod si necesitas el título (la key se queda dentro).

---

## 6) DEPLOY / OPS (cómo se sube a prod)

- **CI**: `.github/workflows/main.yml` construye y publica
  `ghcr.io/danielramosacosta/norznab` **al hacer push a `main`** (tags
  `main-<sha>` y `sha-<longsha>`). No corre en PRs. Comprueba con `gh run watch`.
- **GitOps (nas-k3s)**: repo `DanielRamosAcosta/nas-k3s`, Tanka/Jsonnet + ArgoCD.
  La versión de norznab está en `lib/versions.json` (`norznab.version =
main-<sha>`). El deploy = bump ahí → PR → CI valida Tanka → squash-merge →
  ArgoCD sincroniza desde la rama `manifests`. norznab vive en ns `arr`.
  `kubectl apply`/`rollout restart` están **prohibidos** por su CLAUDE.md.
- Hay un **subagente de ops** (`norznab-ops`, tipo general-purpose, en background,
  permisos bypass) que ya sabe hacer todo esto: bump + PR + merge + verificar
  rollout + reconciliar git. Lánzalo con el `Agent` tool y coordínalo por
  `SendMessage`. Nota: el `origin` de nas-k3s tiene **doble push URL** (GitHub +
  un mirror `nas`); tras el squash-merge hay que **alinear el mirror** (force-push
  al mirror, NO a GitHub). El clasificador marca el force-push como sensible pero
  está autorizado para la reconciliación del mirror.

---

## 7) FICHEROS CLAVE

- `src/domain/providers/dontorrent/` — scrapper (`client/DonTorrentScrapper.ts`),
  interfaz (`client/DonTorrent.ts`), adapters, models (formatos, PoW, etc.).
- `src/domain/providers/wolfmax4k/client/Http3Client.ts` — referencia de
  transporte inyectable + reciclado de conexiones (patrón a imitar).
- `src/infrastructure/config.ts`, `src/infrastructure/container.ts` — config y DI.
- `CLAUDE.md` — convenciones del repo.

---

## 8) RESUMEN EN UNA FRASE

DonTorrent clearnet está SNI-bloqueado en prod; queremos que norznab lo use por
Tor (.onion). El onion es alcanzable pero tiene **otra estructura** y su búsqueda
me devolvía **vacío** — **el primer paso es reverse-engineering empírico de cómo
busca y renderiza resultados el onion**, luego montar Tor en el clúster y escribir
el scrapper onion detrás de la interfaz `DonTorrent` existente.
