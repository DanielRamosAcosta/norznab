# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Norznab** is a Torznab-compatible API server built with Node.js that integrates with Sonarr and other \*arr-stack services. It serves as a mock indexer/search API that returns TV show results in Torznab XML format. The project includes Docker Compose setup to run the Norznab API alongside Sonarr and Deluge (torrent client).

## Development Commands

```bash
# Start the development server
npm start

# Run tests
npm test

# Run a single test file
node --test src/index.spec.ts

# Type checking
npm run typecheck

# Format code with Prettier
npm run format

```

## Project Structure

- **src/index.ts** - Main Hono server implementing Torznab API endpoints
- **src/index.spec.ts** - Integration test using Sonarr API
- **docker-compose.yml** - Orchestrates Norznab API, Sonarr, and Deluge containers
- **Dockerfile** - Node.js container build configuration

## Architecture & Key Concepts

### Torznab API Protocol

The project implements Torznab, a torrent search API specification. The single `/api` endpoint accepts query parameters for different search types and returns XML responses:

**Required parameter:**

- `t` - search type (e.g., `caps`, `search`, `tvsearch`, `movie-search`, `audio-search`, `book-search`)

**Optional parameters:**

- `cat` - comma-separated category IDs (2000=Movies, 5000=TV, 3000=Audio, 8000=Books)
- `q` - generic search query
- `tvdbid` - TV database ID
- `season`, `ep` - TV season/episode filtering
- `apikey` - authentication token
- `offset`, `limit` - pagination parameters
- `extended` - verbose results flag

### Response Format

- **`/api?t=caps`** - Returns XML capabilities document listing supported search types and categories
- **Search endpoints** - Return RSS feed with `<torznab:attr>` tags for structured data (title, link, size, seeders, category, episode info, etc.)
- **Error responses** - Return error XML with code and description

### Mock Data

Currently, the API returns hardcoded mock results for testing:

- 4 mock Breaking Bad and Office episodes in the response handler
- Results are filtered by requested categories and season/episode parameters
- Mock magnet link is read from `./example-magnet.url`

### Docker Architecture

The docker-compose setup creates three interconnected services:

1. **norznab-api** (Port 3000) - This application
2. **sonarr** (Port 8989) - TV show manager that uses Norznab as an indexer
3. **deluge** (Port 8112) - Torrent client for downloading

Services communicate via `arrs-network` bridge network. Sonarr is configured to contact the Norznab API using the container name: `http://norznab-api:3000/api`

## Tech Stack

- **Framework**: Hono 4.x (lightweight HTTP framework)
- **Runtime**: Node.js 24 with ES modules
- **Language**: TypeScript 5.x (with strict mode)
- **Testing**: Vitest 4.x
- **XML Handling**: Manual string building with proper escaping
- **Sonarr Integration**: @ilyamatsuev/tsarr v1.9.3 (Type-safe Sonarr v4 SDK)

## Running TypeScript Files

Node.js 24 has **native TypeScript support**. No need for `tsx`, `ts-node`, or any transpiler:

```bash
# ✓ Correct - run TypeScript directly with Node
node see-radarr-queue.ts
node src/index.ts

# ✗ Wrong - unnecessary tools
npx tsx see-radarr-queue.ts
npx ts-node src/index.ts
```

This applies to all `.ts` files in the project.

## XML Response Details

All responses are UTF-8 encoded XML with proper escaping:

- Special characters are escaped: `&`, `<`, `>`, `"`, `'`
- RSS feed uses `<torznab:attr>` namespace for structured attributes
- Error responses use dedicated error XML format with numeric codes

## Torrent Sources / Providers

Providers live under `src/domain/providers/<name>/` and plug into the search
handlers via inversify tokens: movie providers bind `Token.MOVIE_ADAPTER`
(`MovieAdapter.findMovie`), TV providers bind `Token.TV_ADAPTER`
(`TVAdapter.findBy`). Both handlers aggregate every bound adapter, so adding a
source is: implement the adapter(s) + bind them in `container.ts`. Each adapter
exposes a `source` slug (`ProviderSource`); the search handlers narrow by the
Torznab `apikey` via `selectBySource` — no key queries every source, a source
slug ("dontorrent", "marcianotorrent", "wolfmax4k", "elitetorrent") queries only
that one, so a \*arr client can register one indexer per source. Current sources:
DonTorrent, MarcianoTorrent, EliteTorrent (movies), wolfmax4k (movies + series).

The HTTP/3 transport (`QuicoHttp3Client`) is shared at
`src/domain/providers/http3/Http3Client.ts` — used by any SNI-blocked source
(wolfmax4k, EliteTorrent).

### EliteTorrent (`src/domain/providers/elitetorrent/`)

WordPress site, movies only. SNI-blocked on TCP (plain `fetch` → `ECONNRESET`)
like wolfmax, so it uses the shared HTTP/3 transport. Search is
`GET /?s=<query>`; results are poster anchors under `.imagen`. Downloads sit
behind an `acortame-esto.com/s.php?i=<token>` ad-gate, but the token is a
client-side obfuscation — `base64`×N wrapping a `ROT13` payload — of the real
`magnet:` / on-site `.torrent` path, so `decodeEliteLink` peels it and the
ad-gate is skipped entirely. The magnet's `dn` is used as the release name.

### wolfmax4k (`src/domain/providers/wolfmax4k/`)

wolfmax4k needs a bespoke transport and download flow; the details are
non-obvious:

- **HTTP/3 transport (`quico`).** wolfmax4k is blocked at the ISP level by
  plaintext-SNI DPI on TCP (a TLS reset on the ClientHello), so `fetch`/`ky`/curl
  fail with `ECONNRESET`. QUIC (UDP/443) is not filtered, so wolfmax4k requests
  go over HTTP/3 via the pure-JS `quico` client (`client/Http3Client.ts`). This
  is the reason this provider does not use `ky` like the others.
- **Search** is `POST /mvc/controllers/data.find.php` (multipart: `token`,
  `cidr`, `c`, `q`, `l`, `pg`; needs a `Referer` and a CSRF `token` scraped from
  any page). It returns JSON (`data.datafinds`), not HTML.
- **Movie vs episode** is decided from the release name, not the `guid` prefix
  (movies also appear under `online/`): episodes carry a `[Cap.SEE]` marker
  (`Cap.309` -> S3E09), movies carry a `(YYYY)` year.
- **Download** goes through the `enlacito.com` ad-gate. `client/EnlacitoResolver.ts`
  replays it without a browser: `GET s.php?i=<token>` (Referer wolfmax) sets a
  `PHPSESSID`; `POST /` with that cookie renders `var link_out`, a GibberishAES
  `Salted__` payload (`client/decodeLink.ts`, static key) that decrypts to the
  signed `.torrent` URL on wolfmax4k, downloaded over HTTP/3.

## Docker Configuration Notes

- Services use `arrs-network` bridge for inter-service communication
- Volumes in docker-compose.yml point to `./docker/` subdirectories for persistent data
- Sonarr depends on norznab-api being up before starting
- Environment variables can be configured via `.env` file (see `.env.example`)

## Sonarr API Integration (@ilyamatsuev/tsarr v1.9.3)

### Client Usage

```typescript
import { SonarrClient } from "@ilyamatsuev/tsarr/sonarr";

const sonarr = new SonarrClient({
  baseUrl: "http://localhost:8989",
  apiKey: "25e7cccabdfa47898d13991d863f529c",
});

// All methods return: { data?: T, error?: unknown } & { request, response }
const result = await sonarr.getSeries();
if (result.error) {
  console.error(result.error);
} else {
  console.log(result.data);
}
```

### Key Methods

**Series Management**

- `getSeries()` - Get all series
- `getSeriesById(id)` - Get specific series
- `addSeries(series)` - Add new series to library
- `updateSeries(id, series)` - Update series config
- `deleteSeries(id, deleteFiles?)` - Remove series
- `searchSeries(term)` - Search for series by name

**Indexer Management**

- `getIndexers()` - List all indexers
- `getIndexer(id)` - Get specific indexer
- `addIndexer(indexer)` - Add new indexer
- `updateIndexer(id, indexer)` - Update indexer config
- `deleteIndexer(id)` - Remove indexer
- `testIndexer(indexer)` - Test indexer configuration

**Episode Management**

- `getEpisodes()` - Get all episodes
- `getEpisode(id)` - Get specific episode
- `updateEpisode(id, episode)` - Mark episode as monitored/unmonitored

**Quality & Profiles**

- `getQualityProfiles()` - List quality profiles
- `getQualityProfile(id)` - Get specific profile
- `addQualityProfile(profile)` - Create new quality profile

**Other Utilities**

- `getSystemStatus()` - Get Sonarr system info
- `getHealth()` - Check system health
- `getDownloadClients()` - List download clients
- `getTags()` - Get all tags
- `getQueue()` - Get download queue

### Integration Flow with Norznab

1. **Setup**: Create SonarrClient with baseUrl and apiKey
2. **Add Indexer**: Use `addIndexer()` to register Norznab as indexer
3. **Add Series**: Use `addSeries()` with search result data
4. **Search**: Sonarr queries Norznab API at `/api?t=tvsearch&tvdbid=XXX`
5. **Evaluate**: Sonarr filters results based on quality rules
6. **Download**: Approved releases are sent to download client via `release.download()`

### Error Handling Pattern

```typescript
const result = await sonarr.getSeries();

if (result.error) {
  console.error("API Error:", result.error);
  // Handle error
} else {
  const series = result.data;
  // Use series data
}
```

All responses follow this discriminated union pattern for type safety.

### Test Configuration

- **Sonarr API Key**: `25e7cccabdfa47898d13991d863f529c`
- **Base URL**: `http://localhost:8989`
- **Test Pattern**: Add series → verify → clean up

### API Key Management

The Sonarr API key is configured in:

- Tests: `src/index.spec.ts`
- Can be regenerated in Sonarr Settings → General → API Key section

## Git Workflow

### Simple One-Line Commits

For quick, straightforward changes (bug fixes, typo corrections, small feature additions), use one-line commits without the `Co-Authored-By` footer:

```bash
git add .
git commit -m "Fix typo in README"
git commit -m "Update API endpoint port"
git commit -m "Add missing dependency"
```

**Example valid one-line commits:**

- `"Refactor test suite with lifecycle hooks"`
- `"Replace @nativecode/sonarr with @ilyamatsuev/tsarr for v4 support"`
- `"Fix Docker networking for Sonarr indexer"`
- `"Update vitest as test runner"`

### When to Use One-Line Format

✓ Use one-line commits when:

- The change is self-contained and obvious
- The commit fits naturally in a single description
- There's no collaboration involved in this particular commit

✗ Don't use one-line format when:

- Multiple authors contributed substantially
- The change requires detailed explanation
- Historical context or decisions need documentation

## TypeScript Import Guidelines

### File Extensions

**Always use `.ts` extension** in import paths, not `.js`:

```typescript
// ✓ Correct
import { TorznabItemTV } from "./TorznabItemTV.ts";
import { SonarrClient } from "@ilyamatsuev/tsarr/sonarr";

// ✗ Wrong
import { TorznabItemTV } from "./TorznabItemTV.js";
import { TorznabItemTV } from "./TorznabItemTV";
```

The project is configured with `moduleResolution: "node16"` and `verbatimModuleSyntax: true`, which requires explicit `.ts` extensions for relative imports.

### Type-Only Imports

When importing **only types** (not values), use `import type`:

```typescript
// ✓ Correct for types-only imports
import type { TorznabItem } from "./TorznabItem.ts";
import type { SomeType } from "./types.ts";

// ✓ Correct for mixed imports (types and values)
import { TorznabItem, createItem } from "./module.ts";

// ✗ Wrong (will cause TS1484 error)
import { TorznabItem } from "./TorznabItem.ts"; // when only using as a type
```

Use `import type` to optimize bundle size and clarify that the import is compile-time only.

## TypeScript Type Safety Best Practices

### The Compiler Is Right

When TypeScript reports a type error, **the compiler is almost always correct**. Don't "fix" it with type casts. Instead, investigate the root cause.

**Bad approach:**

```typescript
// ✗ Never do this
const client = testClient(app) as any;
const client = testClient(app) as unknown as ApiTestClient;
```

The `as any` or multiple casts are red flags that indicate the actual problem is elsewhere in your code, not in the type system.

**Good approach:**

- When TypeScript complains, first read the error message carefully
- Examine the actual code causing the error
- Consult library documentation to understand correct usage
- Fix the underlying issue, not the type

### Real-World Example: Hono testClient

**Problem:** `testClient()` wasn't inferring route types, causing `'client' is of type 'unknown'` errors.

**Wrong solutions tried:**

1. `as any` - Completely breaks type safety
2. `as unknown as ApiTestClient` - Creating fake interfaces to hide the problem
3. Manual helper functions to "work around" the issue - Adds unnecessary complexity

**Correct solution:**
Hono's `testClient` requires routes to be **chained directly** on the Hono instance:

```typescript
// ✗ Wrong - routes defined after instantiation
const app = new Hono();
app.get("/api", (c) => { ... });

// ✓ Correct - routes chained directly
export const app = new Hono().get("/api", (c) => { ... });
```

The type inference relies on the type flowing through the chained method calls. Separating instantiation from route definition breaks the type flow.

### Key Principle

> **If you find yourself reaching for `as` or type casts to fix a TypeScript error, stop and investigate why TypeScript is complaining. The answer is in your code, not in a cast.**

Always consult:

- Library documentation
- Your framework's typing conventions
- The actual TypeScript error message (they're usually very informative)

Before adding any type assertion or cast.

## Network Issues and Corporate Proxy

If tests fail with certificate errors like:

```
Hostname/IP does not match certificate's altnames
```

This is caused by a corporate VPN/proxy intercepting external requests. **Do not try to fix this in code** - simply disconnect from the VPN and run the tests again.

## Zod Schema Guidelines

### Always Use Strict Schemas

All Zod schemas must use `.strict()` to catch unexpected fields early:

```typescript
// ✓ Correct
const UserSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .strict();

// ✗ Wrong - never use passthrough
const UserSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .passthrough();
```

### Prefer Required Over Optional

Always prefer required fields over optional ones. Only use `.optional()` when the field is truly optional in the domain:

```typescript
// ✓ Correct - field is always present
const MovieSchema = z
  .object({
    id: z.number(),
    title: z.string(),
  })
  .strict();

// ✗ Wrong - making everything optional "just in case"
const MovieSchema = z
  .object({
    id: z.number().optional(),
    title: z.string().optional(),
  })
  .strict();
```

### When External APIs Return Unknown Fields

If an external API returns fields not in your schema, add them explicitly rather than using `.passthrough()`:

```typescript
// ✓ Correct - add the new field
const ResponseSchema = z
  .object({
    data: z.string(),
    newField: z.boolean().optional(), // Add explicitly
  })
  .strict();

// ✗ Wrong - using passthrough to ignore unknown fields
const ResponseSchema = z
  .object({
    data: z.string(),
  })
  .passthrough();
```
