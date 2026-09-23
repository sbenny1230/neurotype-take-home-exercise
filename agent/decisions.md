# Decision record

Chronological log of notable changes and decisions made while working on this repo.
Newest entries at the bottom. One entry per decision, not per commit.

## 2026-09-23 — Fix web container crash (rollup optional-dep bug)

**Problem:** `docker compose up` had `web` crashing with `Cannot find module
@rollup/rollup-linux-x64-musl` (npm/cli#4828).

**Root cause:** `web/package-lock.json` was generated on a non-musl host, so it never
pinned the musl rollup binary. `./web` is bind-mounted into the Alpine container, so the
container always installed against that lockfile instead of resolving for its own
platform.

**Fix:** Regenerated `package-lock.json` from inside the container
(`docker compose run web npm install` after clearing `node_modules`/lock), so the
optional deps are resolved for linux-musl. Confirmed with `./verify.sh`.

**Follow-up:** Don't run `npm install` for `web/` on the host — it will regenerate the
lockfile for the host's libc (glibc on WSL2) and reintroduce this. Run installs through
the container (`docker compose run web npm install ...`) instead.

**Also:** `chmod +x verify.sh` — it wasn't executable in the checkout, so `./verify.sh`
failed with "Permission denied". Left as an unstaged mode change for the user to commit
or not.

## 2026-09-23 — Architecture decisions for the report review service

Interviewed the user before implementation on three open questions from the brief:

**Auth:** mock identity only — clinician picked from a seed list, no login/password
flow. Real auth was out of scope for the 4-hour bar.

**Storage:** `data/assessments.jsonl` loads into Postgres on startup; Postgres holds
the working copy, audit log, issued status, and corrected summaries. Not flat-file
mutation — the db container is already in the harness and supports queue
filtering/audit querying properly.

**Audit scope:** log both views (assessment opened) and changes (issue, summary
correction), not changes-only — required to satisfy the brief's "who looked at what,
when, and what changed."

**Scoring rules** (none of this is in `data/assessments.jsonl`, brief is the only
source):
- Domain % = mean of `raw/max*100` across a domain's items.
- Bands: Minimal 0-39, Mild 40-54, Moderate 55-84, Substantial 85-100.
- Review flag ON when: any domain bands Substantial, any item `completed: false`, or
  `summary` length < 200 chars.
- Age = years/months at `assessed_at`, from `client.date_of_birth`.
- Percentages/bands/flag are calculated, not stored — recompute, don't cache as fixed.
- Issued reports are immutable except: summary typo corrections remain editable
  afterward (no mechanism for this exists yet — needs building).

## 2026-09-23 — Scoring module: null-item handling

The brief didn't say what happens to `raw: null` items in the domain % mean, so checked
the dataset before deciding: 48/2229 items (2.2%) are null, spread evenly across all
five domains, and 2 domain-instances have every item null.

**Decision:** exclude uncompleted/null items from the mean entirely (don't impute,
don't count as 0). The review flag already surfaces incompleteness separately, so the
percentage doesn't need to double as an incompleteness penalty. A domain with zero
completed items returns `None` (not assessed) rather than a fabricated 0%/Minimal band.

**Implemented:** `api/scoring.py` (`domain_percentage`, `band_for_percentage`,
`review_flag`, `age_at`) and `api/models.py` (`Item`, `Domain`, `Client`, `Assessment`
dataclasses), test-first in `api/tests/test_scoring.py`. Pytest wired up as the api test
runner (`requirements.txt`, `agent/rules/testing.md` updated with the run command).

## 2026-09-23 — Restructured api into feature folders, picked FastAPI

Flat `api/main.py` (stdlib), `api/models.py`, `api/scoring.py` reorganized per the
user's requested layout: `src/<feature>/{model,service,routes}.py`, a `utils/` folder
for shared helpers, config centralized in `src/config.py` (single place that reads
env vars), `main.py` reduced to just building the app and registering routers, and
`tests/` mirroring `src/`.

**Framework:** FastAPI, chosen over Flask — pairs with the python.md rule to use
dataclasses/pydantic for structured data, gives type-hinted routes and request
validation for free, and `APIRouter` per feature keeps `main.py` thin without extra
plumbing.

**Layout:**
- `src/health/routes.py` — `GET /health`, moved off the stdlib handler.
- `src/assessments/{model,service}.py` — the scoring module from the previous entry,
  moved as-is. No `routes.py` yet since no assessments endpoints exist — added when
  that task lands, not scaffolded empty ahead of time.
- `src/utils/` — created empty, ready for the first shared helper that isn't
  feature-specific.

Dockerfile `CMD` now runs `uvicorn src.main:app`; `requirements.txt` gained `fastapi`,
`uvicorn[standard]`, `httpx` (FastAPI's `TestClient`). Verified: full test suite green,
and `uvicorn src.main:app` boots and serves `GET /health` → 200.

## 2026-09-23 — Load assessments.jsonl into Postgres on startup

**Decision:** `domain_scores` (percentage + band per domain) and `review_flag` are
stored as columns, computed at load time from `src/assessments/service.py`, rather
than only recomputed in Python at read time. Asked the user first — the brief flags
that the live service "holds years of them and takes on more every week," so queue
filtering/sorting needs to happen in SQL, not by scoring every row in Python on every
request. They're a cache of the raw `domains` JSONB (the actual source of truth), not
a second source of truth — reloading recomputes them if the scoring rules change.

**Implemented:**
- `src/utils/db.py` — `get_connection()`, one psycopg connection per call (ponytail:
  no pooling yet, add `psycopg_pool` if concurrent load becomes an issue).
- `src/assessments/model.py` — added `parse_assessment(dict) -> Assessment`, parsing
  one decoded line of `assessments.jsonl`.
- `src/assessments/repository.py` — `create_schema` (idempotent `CREATE TABLE IF NOT
  EXISTS assessments`, one row per assessment: client/PII fields, `assessed_at`,
  `clinician_id`, raw `domains` JSONB, `summary`, `domain_scores` JSONB,
  `review_flag`), `load_jsonl` (upserts every line via `INSERT ... ON CONFLICT
  (assessment_id) DO UPDATE`, so reloading re-syncs instead of duplicating).
- `src/main.py` — FastAPI `lifespan` hook runs `create_schema` + `load_jsonl` against
  `DATA_FILE` on every startup.

No `issued_at` / issue-state column yet — that's the issue endpoint's concern, added
when that task lands rather than scaffolded ahead of time.

**Verified:** `docker compose up --build api` logs `loaded 100 assessments`; spot-checked
the table in psql (correct bands/percentages, including the two domains with zero
completed items showing `band: null`); `docker compose exec api pytest` — 15 passed,
including new Postgres-integration tests in `tests/assessments/test_repository.py`
(insert-with-computed-scoring, idempotent reload, upsert-on-changed-field); full
`./verify.sh` contract still green.

**Renamed:** `repository.py`/`test_repository.py` → `store.py`/`test_store.py` — the
user didn't like the original name. Also moved `parse_assessment` out of `model.py`
into `store.py` (its only caller) so `model.py` stays dataclasses-only, per the user's
request.
