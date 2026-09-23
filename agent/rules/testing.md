# Testing

- Test-driven development is mandatory: write a failing test first, write the minimum code to
  pass it, then refactor. Do not write implementation code that has no failing test behind it.
- Every domain-logic path (scoring, aggregation, validation of `data/assessments.jsonl` records,
  API responses) must be covered by a test before it's considered done.
- api: `docker compose exec api pytest` (or `cd api && python3 -m pytest tests/` outside
  Docker). Wired up alongside the scoring module — pytest in `requirements.txt`, tests
  under `api/tests/`.
- web: not wired up yet. The first task that touches `web/` should add vitest as part of
  its first commit, not as an afterthought.
- A single command should be able to run the whole suite; keep `verify.sh` and this file
  pointing at it once both sides are wired up.
