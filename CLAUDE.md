# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A take-home exercise starter harness (currently almost entirely unimplemented — see
[README.md](README.md)). It is not a real product; it's plumbing meant to be replaced. The task
is to build an "assessment review" tool on top of the sample data in
[data/assessments.jsonl](data/assessments.jsonl). Nothing in `api/` or `web/` currently reads
that file or implements any domain logic — that is the actual exercise.

## The contract (must stay true)

Whatever gets built here, these three things must hold on a clean clone:

| | |
|---|---|
| `docker compose up` | brings the whole stack up with only Docker installed |
| `http://localhost:8000/health` | returns 200 |
| `http://localhost:5173` | serves the web app |

Run `./verify.sh` (after `docker compose up`) to check the last two, plus a non-fatal warning
if the API isn't sending CORS headers for `http://localhost:5173` — the web app is a different
origin, so without CORS the browser silently blocks every API call and the page just shows no
data even though both health checks pass.

## Commands

```bash
docker compose up          # bring up api (8000), web (5173), db (postgres)
./verify.sh                # check the contract above (run after `docker compose up`)
npm run build               # (in web/) tsc -b && vite build — passes on a clean checkout, usable as a check gate
```

Both `api/` and `web/` mount their source as a volume, so edits show up live without a rebuild.
Dependency changes need different commands because of how each container installs deps:

| changed | run |
|---|---|
| `api/requirements.txt` | `docker compose up --build api` |
| `web/package.json` | `docker compose restart web` (NOT `--build`: `node_modules` lives in a volume that shadows the image layer, and the web container runs `npm install` on start) |

There is no test runner or CI wired up yet — set up whatever fits the chosen framework.

## Architecture

- **`api/`** — currently stdlib-only Python (`http.server`) serving just `GET /health`. This is
  a placeholder meant to be deleted and replaced with a real framework (FastAPI, Flask, Django,
  Litestar, ...); `requirements.txt` is intentionally empty. Whatever replaces it must keep:
  listening on port 8000, `GET /health` returning 200, and CORS enabled for
  `WEB_ORIGIN` (`http://localhost:5173`).
- **`web/`** — bare Vite + React 19 + TypeScript app ([web/src/App.tsx](web/src/App.tsx) is a
  placeholder that just polls `/health`). No router, component library, or state management is
  set up; `VITE_API_URL` (default `http://localhost:8000`) is how it reaches the API.
- **`db`** — Postgres 16 service in [docker-compose.yml](docker-compose.yml), healthchecked but
  with no volume (data is lost on `docker compose down`). It's optional scaffolding — fine to
  delete in favor of SQLite/DuckDB/files, or to add a volume if persistence is wanted.
- **`data/assessments.jsonl`** — 100 sample assessments, one JSON object per line, mounted
  read-only into the api container at `/data/assessments.jsonl` (path given via `DATA_FILE` env
  var). Nothing reads it yet. Each record has: `assessment_id`, `client` (contains PII:
  `date_of_birth`, `nhs_number`, `guardian_contact`), `assessed_at`, `clinician_id`, `domains`
  (a list of `{domain, items[]}` where each item has `code`, `raw`, `max`, `completed` — `raw`
  can be `null` when `completed` is `false`), and a free-text `summary`.

## Things worth knowing

- Ports 8000 (api) and 5173 (web) are fixed by the contract above; if changed, `verify.sh` needs
  updating too.
- The harness deliberately contains no domain code or modeling hints.
