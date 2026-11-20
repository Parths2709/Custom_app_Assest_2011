# F1-US01-CRUD Backend

Production-ready REST API scaffold built with **Node.js 20+** and **Express 5**.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | Express 5.3.0 |
| Security headers | Helmet 8 |
| CORS | cors 2.8.6 |
| HTTP logging | Morgan 1.12 |
| Environment | dotenv 18 |
| API docs | swagger-jsdoc 6 + swagger-ui-express 5 |
| Linting | ESLint 10 (flat config) |
| Formatting | Prettier 3 |
| Dev reloading | Nodemon 3 |

## Project Structure

```
src/
  config/         Environment-based configuration
  docs/           swagger-jsdoc spec definition
  middleware/     notFound (404) + errorHandler (global)
  routes/         Express routers with @openapi JSDoc annotations
  utils/          Request logger (Morgan)
  app.js          Express app factory (no listen call)
  server.js       HTTP server entry point with graceful shutdown
scripts/
  generate-openapi.js   Writes .polaira/openapi.json from swagger-jsdoc
.polaira/
  emit-openapi.sh       Regenerates the OpenAPI document from source
```

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env

# Start development server (auto-reloads on file changes)
npm run dev

# Start production server
npm start
```

The API will be available at `http://localhost:3000`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/health` | Liveness probe |
| `GET /api-docs` | Swagger UI (interactive docs) |
| `GET /api-docs.json` | Raw OpenAPI JSON |

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the production server |
| `npm run dev` | Start with Nodemon (watch mode) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint findings |
| `npm run format` | Format all source files with Prettier |
| `npm run format:check` | Check formatting without writing |

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | TCP port the server listens on |
| `NODE_ENV` | `development` | `development` / `production` |
| `API_PREFIX` | `/api/v1` | URL prefix for all API routes |

## OpenAPI Document

The machine-readable API description lives at `.polaira/openapi.json` (excluded from git — it is a build artifact). To regenerate it:

```bash
bash .polaira/emit-openapi.sh
```

Add new routes to `src/routes/` and annotate them with `@openapi` JSDoc tags (see `src/routes/health.js` for an example). The script re-reads those annotations and rewrites the JSON file.

## Adding a CRUD Resource

1. Create `src/routes/<resource>.js` with an Express `Router`.
2. Annotate each handler with `@openapi` JSDoc tags.
3. Register the router in `src/routes/index.js`.
4. Run `bash .polaira/emit-openapi.sh` to regenerate the spec.

## Security Audit

Run `npm audit` to check for known vulnerabilities in the dependency tree.

**Findings at scaffold time (2026-11-20) — 4 moderate, all transitive:**

| Advisory | Affected package | Via | Notes |
|---|---|---|---|
| GHSA-3g3m-2fjr-6pw4 | `glob` 9–14 | `swagger-jsdoc` 6.3.0 | AbortSignal cancellation bypass; build-time only |
| GHSA-g3hv-75wg-m249 | `minimatch` 7–11 | `glob` (via above) + `nodemon` | DoS via globparts amplification; dev/build-time only |

Both findings are in build/dev-time tooling, not in the Express request path. The npm-suggested fix (`npm audit fix --force`) would downgrade `swagger-jsdoc` from 6.3.0 → 6.2.8 (marked as a breaking change by npm). Monitor upstream for a non-breaking resolution.
