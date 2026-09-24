# Testing

- Test-driven development is mandatory: write a failing test first, write the minimum code to
  pass it, then refactor. Do not write implementation code that has no failing test behind it.
- When a test fails, change the implementation (minimally) to make it pass, not the test.
  Only edit a test when the test itself is wrong (asserts the wrong behaviour), and say so.
- Every domain-logic path (scoring, aggregation, validation of `data/assessments.jsonl` records,
  API responses) must be covered by a test before it's considered done.
- api: `docker compose exec api pytest` (needs `db` up too — some tests hit a real
  Postgres). Pure-logic tests also run standalone with
  `cd api && python3 -m pytest tests/`. Pytest wired up alongside the scoring module;
  tests under `api/tests/`, mirroring `api/src/`.
- web: not wired up yet. The first task that touches `web/` should add vitest as part of
  its first commit, not as an afterthought.
- A single command should be able to run the whole suite; keep `verify.sh` and this file
  pointing at it once both sides are wired up.
