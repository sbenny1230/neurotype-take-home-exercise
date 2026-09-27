# Neurotype take-home: assessment review

A review queue for neurodevelopmental assessments. The 100 sample assessments in
[`data/assessments.jsonl`](data/assessments.jsonl) are loaded into Postgres and scored. A
clinician sees them as a queue: flagged assessments first, a support-need band for each of the
five domains, and filters for review status, clinician, assessed date, assessment ID and score.

## Running it

```bash
docker compose up
./verify.sh          # in another terminal, once the stack is up
```

| | |
|---|---|
| http://localhost:5173 | the web app (review queue) |
| http://localhost:8000/health | api health check, returns 200 |
| http://localhost:8000/docs | api reference (OpenAPI, grouped by feature) |

Only Docker is needed. The first run builds two images, so give it a couple of minutes;
`verify.sh` waits for both services.

### The contract

| | |
|---|---|
| `docker compose up` | brings the whole stack up on a machine with only Docker installed |
| `http://localhost:8000/health` | returns 200 |
| `http://localhost:5173` | serves the app |

## What's built

### Review queue (web)

- **Queue table:** assessment ID, assessed date (UK format), clinician, a "Needs review" label,
  and one band column per domain (Minimal, Mild, Moderate, Substantial, or "Not assessed").
  Hovering a band shows its percentage; hovering a domain header shows its full name.
- **Order:** flagged assessments first, then oldest first within each group.
- **Filters:** a collapsible panel for assessment ID (contains), review status, clinician,
  assessed date range and a percentage range in one domain. Invalid combinations are explained
  in the form and never sent to the api. Filters live in the URL, so reload, back/forward and
  shared links keep them.
- **States:** skeleton rows while loading, an error message with Retry, an empty-queue message,
  and a dimmed table while a new filter loads.
- **Design:** follows [neurotype.uk](https://neurotype.uk): Open Sans, navy and indigo, soft
  lavender borders, the Neurotype logo. A dark palette follows the OS setting.
- **Accessibility:** built to WCAG 2.1 AA. Contrast is checked for every colour pair in both
  palettes, sizes are relative so text zoom and reflow work, status is written out in words
  rather than shown by colour alone, and loading/error messages are announced to screen
  readers. See [`agent/rules/accessibility.md`](agent/rules/accessibility.md).

### API

| Endpoint | Returns |
|---|---|
| `GET /health` | `{"status": "ok"}` |
| `GET /assessments` | the queue: `assessment_id`, `clinician_id`, `assessed_at`, `review_flag`, `domain_scores` (percentage and band per domain). No client PII. |
| `GET /clinicians` | distinct clinician IDs, sorted |

`GET /assessments` filters, all optional and combinable, all applied in SQL:

| Parameter | Meaning |
|---|---|
| `review_flag=true\|false` | flagged or not |
| `clinician_id=c-008` | exact match |
| `assessed_from`, `assessed_to` | inclusive dates, compared as UK calendar days |
| `search=0005` | assessment ID contains, case-insensitive |
| `score_domain`, `score_min`, `score_max` | percentage range (0–100) in one domain |

Invalid input (unknown domain, reversed ranges, a score range with no domain) returns 422.

### Scoring

The rules come from the brief; none of them are in the data file.

- **Domain percentage:** the mean of `raw / max × 100` over a domain's completed items.
  Uncompleted (`null`) items are left out rather than counted as 0. A domain with no completed
  items is "not assessed" rather than 0%. (2.2% of items in the sample are `null`.)
- **Bands:** Minimal 0–39, Mild 40–54, Moderate 55–84, Substantial 85–100.
- **Review flag:** on when any domain is Substantial, any item is uncompleted, or the summary is
  under 200 characters.

Scores and flags are computed when the data is loaded and stored next to the raw items, so the
queue can filter and sort in SQL rather than rescoring every row per request. Reloading
recomputes them.

## How it's built

| | |
|---|---|
| api | FastAPI, psycopg 3, Postgres 16. The data file is loaded on startup with an idempotent upsert. |
| web | React 19, TypeScript (strict), Vite, Redux Toolkit / RTK Query, SCSS modules |
| tests | pytest (api, including integration tests against a separate `_test` database), Vitest + Testing Library (web) |
| tooling | ESLint, Prettier |

Layout in short:

```
api/src/<feature>/     model.py (data) · service.py (decisions) · store.py (SQL) · routes.py (HTTP)
web/src/
  pages/QueuePage/     the page, its parts (FilterPanel, Tooltip) and their hooks
  services/            RTK Query endpoints, one shared api instance
  components/ types/ utils/ styles/ assets/
```

Components hold only markup. State and logic live in a colocated hook (`FilterPanel.tsx` →
`useFilterPanel.ts`). More detail is in [`api/README.md`](api/README.md) and the rule files in
[`agent/rules/`](agent/rules/). The reasons behind the main choices are logged in
[`agent/decisions.md`](agent/decisions.md).

## Checks

`./verify.sh` runs everything against the running stack:

1. the contract: api health, web page, CORS for the web origin
2. api tests: `docker compose exec api pytest` (48 tests)
3. web tests: `docker compose exec web npm test` (31 tests)
4. web lint and formatting: `npm run lint`, `npm run format:check`

The web type-check runs with `docker compose exec web npm run build`.

Everything is written test-first.

## Development notes

- **api code changes:** `docker compose restart api`. uvicorn runs without `--reload`.
- **web code changes:** picked up live by Vite.
- **New api dependency** in `requirements.txt`: `docker compose up --build api`.
- **New web dependency:** `docker compose exec web npm install <pkg>`, then
  `docker compose restart web`. Install through the container, not on the host, so the lockfile
  resolves for the container's Alpine platform.
- **Editor type errors** such as "cannot find module 'react/jsx-runtime'": run `npm ci` in
  `web/` on the host and restart the TypeScript server. The container keeps its packages in a
  volume that the host can't see; `npm ci` installs from the lockfile without changing it.
- **Data:** Postgres has no volume, so `docker compose down` discards it. The api reloads
  `data/assessments.jsonl` on every start.

## Not built yet

Planned, in order: an assessment detail page (scores, the young person's age at assessment,
summary), issuing a report (fixed once issued), summary corrections after issue, a mock
clinician identity, and an audit log of who viewed or changed what. The data model and
decisions for these are recorded in [`agent/decisions.md`](agent/decisions.md).
