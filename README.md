# Norznab

A [Torznab](https://torznab.github.io/spec-1.3-draft/index.html)-compatible
indexer for the \*arr stack (Radarr / Sonarr). It exposes a single `/api`
endpoint that searches a set of Spanish torrent sites and returns results in
Torznab XML, so Radarr/Sonarr can treat them as ordinary indexers.

Built with Hono on Node.js 24 (native TypeScript, ES modules).

## Sources

Each source is scraped by its own adapter. Because several sites block plain HTTP
at the network level, some use bespoke transports:

| Source           | Content         | Transport                          |
| ---------------- | --------------- | ---------------------------------- |
| **DonTorrent**   | movies + series | plain `fetch` (HTTPS)              |
| **EliteTorrent** | movies          | HTTP/3 / QUIC (TCP is SNI-blocked) |

## One indexer per source (API key = source)

Norznab does **not** aggregate every source under a single indexer. Instead it
uses the Torznab **API key as a source selector**: a request only returns results
when its key exactly matches a source slug. A missing or unknown key returns
nothing.

So in Radarr/Sonarr you add **one Torznab indexer per source**, all pointing at
the same norznab server, each with a different API key:

| API key        | Queries      |
| -------------- | ------------ |
| `dontorrent`   | DonTorrent   |
| `elitetorrent` | EliteTorrent |

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

| Variable                        | Default                        | Notes                                     |
| ------------------------------- | ------------------------------ | ----------------------------------------- |
| `TMDB_API_KEY`                  | _required_                     | Resolves tmdbid → title for searches      |
| `DON_TORRENT_BASE_URL`          | `https://dontorrent.tips`      | Seed domain; updated from 301s at runtime |
| `ELITE_TORRENT_BASE_URL`        | `https://www.elitetorrent.com` |                                           |
| `ELITE_TORRENT_HTTP_TIMEOUT_MS` | `15000`                        | Per-request timeout for the HTTP/3 source |
| `REQUEST_TIMEOUT_MS`            | `30000`                        |                                           |

## Development

```bash
npm run test:unitary   # unit tests (*.spec.ts)
npm run typecheck      # tsc --noEmit
npm run format         # prettier
```
