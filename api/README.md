# api

FastAPI backend for the assessment review service.

## Structure

```
api/
  src/
    main.py            # entrypoint: builds the FastAPI app, wires CORS, includes routers
    config.py           # single place that reads env vars (WEB_ORIGIN, DATA_FILE, DATABASE_URL)
    clients/             # connections to outside systems: db connection, third-party credentials
    <feature>/
      model.py           # describes data: dataclasses, enums, pydantic request models
      service.py          # makes decisions: anything needing neither a db connection nor a request
      store.py            # persistence: SQL and connections
      routes.py           # HTTP: FastAPI router (only once the feature has endpoints)
  tests/
    <feature>/            # mirrors src/, one test file per module it covers
  requirements.txt
  Dockerfile
```

Each feature under `src/` owns its own model, logic, and routes. `main.py` stays
thin — it only starts the app and registers routers, it never contains business logic.

Current features:
- `health` — liveness check (`GET /health`)
- `assessments` — scoring/banding/review-flag domain logic, a `store.py` that
  creates the Postgres schema and loads `data/assessments.jsonl` on startup, and the
  queue endpoint (`GET /assessments`, with filters)
- `clinicians` — distinct clinician IDs for the queue's clinician filter (`GET /clinicians`)

## Data

`data/assessments.jsonl` loads into the `assessments` table on every app startup
(`src/main.py`'s lifespan hook, via `src/assessments/store.py`). The load is
idempotent — an `INSERT ... ON CONFLICT (assessment_id) DO UPDATE`, keyed on
`assessment_id` — so restarting the app re-syncs from the file rather than
duplicating rows.

Alongside the raw `domains` JSONB, each row also gets `domain_scores` (per-domain
percentage/band) and `review_flag`, computed once at load time from
`src/assessments/service.py`. These are a cache for SQL-side filtering/sorting once
the queue exists, not a second source of truth — if the scoring rules change,
restarting the app (or re-running the loader) recomputes them from the raw domains.

## Setup

Via Docker (from the repo root):

```bash
docker compose up --build api
```

Outside Docker:

```bash
cd api
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Config is read from environment variables (see `src/config.py`):
`WEB_ORIGIN`, `DATA_FILE`, `DATABASE_URL`. `docker-compose.yml` sets these; outside
Docker, set them in your shell or a `.env` you source yourself.

## Tests

`tests/assessments/test_store.py` runs against a real Postgres, but its own
`<DATABASE_URL>_test` database (`tests/conftest.py` creates it on first run) — never
the `DATABASE_URL` database the app loads real data into. Run tests inside the
container/compose network, not on the bare host:

```bash
docker compose up -d db api
docker compose exec api pytest
```

Everything else (`test_service.py`, `test_routes.py`) has no external dependency and
also runs standalone with `cd api && python3 -m pytest tests/` if you only touched
pure logic.

Tests mirror `src/`'s structure — `tests/assessments/test_service.py` covers
`src/assessments/service.py`, and so on.
