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
