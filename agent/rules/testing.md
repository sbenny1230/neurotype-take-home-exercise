# Testing

- Test-driven development is mandatory: write a failing test first, write the minimum code to
  pass it, then refactor. Do not write implementation code that has no failing test behind it.
- Every domain-logic path (scoring, aggregation, validation of `data/assessments.jsonl` records,
  API responses) must be covered by a test before it's considered done.
- No test runner is wired up yet. The first task that touches `api/` or `web/` should wire one
  up (e.g. pytest for the api, vitest for the web) as part of its first commit, not as an
  afterthought.
- Once wired up, replace this note with the actual commands, e.g.:
  - api: `docker compose exec api pytest`
  - web: `docker compose exec web npm test`
- A single command should be able to run the whole suite; keep `verify.sh` and this file
  pointing at it.
