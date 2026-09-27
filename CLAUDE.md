# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A take-home exercise starter harness (see [README.md](README.md)). Almost nothing is
implemented yet — the task is to build an "assessment review" tool on top of the sample data in
[data/assessments.jsonl](data/assessments.jsonl). `api/` and `web/` are placeholders; nothing
reads that file or implements domain logic yet.

## The contract (must stay true)

| | |
|---|---|
| `docker compose up` | brings the whole stack up with only Docker installed |
| `http://localhost:8000/health` | returns 200 |
| `http://localhost:5173` | serves the web app |

Run `./verify.sh` after `docker compose up` to check it, including a CORS warning: the web app
and api are different origins, so missing CORS headers make the page silently show no data even
though both health checks pass.

## Commands

```bash
docker compose up          # api (8000), web (5173), db (postgres)
./verify.sh                # check the contract above
```

- api dependency added to `requirements.txt` → `docker compose up --build api`
- web dependency added to `package.json` → `docker compose restart web` (not `--build`:
  `node_modules` is a volume that shadows the image layer)
- Editor types for `web/` (VS Code "cannot find module 'react/jsx-runtime'"): run `npm ci` in
  `web/` on the host, then restart the TS server. The container's `node_modules` volume is
  invisible to the host. Use `npm ci`, never `npm install`, on the host: `ci` leaves the
  container-generated lockfile untouched.
- `npm run build` (in `web/`) runs `tsc -b && vite build`; passes on a clean checkout, usable as
  a check gate.

## Architecture

- **`api/`** — stdlib-only Python placeholder serving `GET /health`. Meant to be replaced with a
  real framework; must keep port 8000, `/health`, and CORS for `WEB_ORIGIN`.
- **`web/`** — bare Vite + React 19 + TypeScript, no router/state/styling set up yet.
- **`db`** — Postgres 16, healthchecked, no volume (data lost on `down`). Optional — fine to
  swap for SQLite/files or delete.
- **`data/assessments.jsonl`** — 100 sample assessments (one JSON object per line), mounted
  read-only at `DATA_FILE`. Each record: `assessment_id`, `client` (PII), `assessed_at`,
  `clinician_id`, `domains[]` (`{domain, items[{code, raw, max, completed}]}`, `raw` may be
  `null`), `summary`.

## Rules

@agent/rules/conventions.md
@agent/rules/python.md
@agent/rules/typescript.md
@agent/rules/react.md
@agent/rules/testing.md
@agent/rules/security.md
@agent/rules/accessibility.md

Keep these rule files current as the project evolves — update them, don't just accumulate
exceptions here.
