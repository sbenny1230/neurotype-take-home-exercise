# Testing

- Test-driven development is mandatory: write a failing test first, write the minimum code to
  pass it, then refactor. Do not write implementation code that has no failing test behind it.
- When a test fails, change the implementation (minimally) to make it pass, not the test.
  Only edit a test when the test itself is wrong (asserts the wrong behaviour), and say so.
- Test data goes in pytest fixtures (or the web runner's equivalent), not built inline in the
  test body. The test body only loads or uses the data, acts, and asserts.
- Every domain-logic path (scoring, aggregation, validation of `data/assessments.jsonl` records,
  API responses) must be covered by a test before it's considered done.
- api: `docker compose exec api pytest` (needs `db` up too — some tests hit a real
  Postgres). Pure-logic tests also run standalone with
  `cd api && python3 -m pytest tests/`. Pytest wired up alongside the scoring module;
  tests under `api/tests/`, mirroring `api/src/`.
- web: `docker compose exec web npm test` (vitest, jsdom environment, configured in
  `web/vite.config.ts`). Tests sit next to the component they cover (`Foo.test.tsx`).
- `./verify.sh` runs both suites (api pytest, web vitest) after the contract checks.
