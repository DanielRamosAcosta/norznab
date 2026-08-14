# Norznab

A [Torznab](https://torznab.github.io/spec-1.3-draft/index.html)-compatible
indexer for the \*arr stack (Radarr / Sonarr). It exposes a single `/api`
endpoint that searches a set of Spanish torrent sites and returns results in
Torznab XML, so Radarr/Sonarr can treat them as ordinary indexers.

Built with Hono on Node.js 24 (native TypeScript, ES modules).

## Sources

Each source is scraped by its own adapter. Because several sites block plain HTTP
at the network level, some use bespoke transports:

| Source           | Content         | Transport                                |
| ---------------- | --------------- | ---------------------------------------- |
| **DonTorrent**   | movies + series | Tor `.onion` (clearnet is SNI-blocked)   |
| **wolfmax4k**    | movies + series | HTTP/3 / QUIC (TCP is SNI-blocked)       |
| **EliteTorrent** | movies          | HTTP/3 / QUIC (TCP is SNI-blocked)       |
| MarcianoTorrent  | movies          | plain HTTP — currently Cloudflare-walled |

## One indexer per source (API key = source)

Norznab does **not** aggregate every source under a single indexer. Instead it
uses the Torznab **API key as a source selector**: a request only returns results
when its key exactly matches a source slug. A missing or unknown key returns
nothing.

So in Radarr/Sonarr you add **one Torznab indexer per source**, all pointing at
the same norznab server, each with a different API key:

| API key           | Queries         |
| ----------------- | --------------- |
| `dontorrent`      | DonTorrent      |
| `wolfmax4k`       | wolfmax4k       |
| `elitetorrent`    | EliteTorrent    |
| `marcianotorrent` | MarcianoTorrent |

This keeps each source separate in the \*arr UI (independent enable/disable,
priority, history and failure handling), which works much better than one
combined indexer.

### Adding an indexer in Radarr/Sonarr

Settings → Indexers → Add → **Torznab** (Custom):

- **URL**: `http://<norznab-host>:3000/api`
- **API Key**: the source slug, e.g. `elitetorrent`
- **Categories**: Movies (2000) and/or TV (5000)

Repeat for each source you want, changing only the API Key.

## Running

```bash
npm install
npm start                 # serves on :3000

# or the full stack (norznab + Sonarr + Deluge)
docker compose up
```

## Configuration

Environment variables (see `src/infrastructure/config.ts`):

| Variable                    | Default                        | Notes                                           |
| --------------------------- | ------------------------------ | ----------------------------------------------- |
| `TMDB_API_KEY`              | _required_                     | Resolves tmdbid → title for searches            |
| `DON_TORRENT_BASE_URL`      | _required_                     | Clearnet base (used when the onion is off)      |
| `MARCIANO_TORRENT_BASE_URL` | _required_                     |                                                 |
| `DON_TORRENT_USE_ONION`     | `false`                        | Route DonTorrent over Tor                       |
| `DON_TORRENT_TOR_PROXY`     | `""`                           | Tor HTTP proxy (`HTTPTunnelPort`) for the onion |
| `DON_TORRENT_ONION_URL`     | the known `.onion`             |                                                 |
| `ELITE_TORRENT_BASE_URL`    | `https://www.elitetorrent.com` |                                                 |
| `WOLFMAX4K_BASE_URL`        | `https://wolfmax4k.com`        |                                                 |
| `WOLFMAX4K_HTTP_TIMEOUT_MS` | `15000`                        | Per-request timeout for the HTTP/3 sources      |
| `REQUEST_TIMEOUT_MS`        | `30000`                        |                                                 |

## Development

```bash
npm run test:unitary   # unit tests (*.spec.ts)
npm run typecheck      # tsc --noEmit
npm run format         # prettier
```
