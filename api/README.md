# api

FastAPI backend for the assessment review service.

## Structure

```
api/
  src/
    main.py            # entrypoint: builds the FastAPI app, wires CORS, includes routers
    config.py           # single place that reads env vars (WEB_ORIGIN, DATA_FILE, DATABASE_URL)
    utils/               # shared helper modules used by more than one feature
    <feature>/
      model.py           # dataclasses for that feature's data
      service.py          # business logic
      routes.py           # FastAPI router (only once the feature has endpoints)
  tests/
    <feature>/            # mirrors src/, one test file per module it covers
  requirements.txt
  Dockerfile
```

Each feature under `src/` owns its own model, logic, and routes. `main.py` stays
thin — it only starts the app and registers routers, it never contains business logic.

Current features:
- `health` — liveness check (`GET /health`)
- `assessments` — scoring/banding/review-flag domain logic (no routes yet)

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

```bash
cd api
python3 -m pytest tests/
```

Or inside the running container:

```bash
docker compose exec api pytest
```

Tests mirror `src/`'s structure — `tests/assessments/test_service.py` covers
`src/assessments/service.py`, and so on. Everything runs with plain `pytest`, no
manual setup required.
