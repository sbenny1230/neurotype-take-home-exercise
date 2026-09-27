# Decisions and notes

## What I built, what I cut, and why

**Built:** the first half of the minimum path in the brief. A reviewer can open the queue and
narrow it.

- The api loads `assessments.jsonl` into Postgres on startup, using an upsert so a restart
  doesn't create duplicates. It scores each assessment as it loads it.
- `GET /assessments` returns the queue: flagged assessments first, then oldest first. It
  filters by review flag, clinician, assessed date range, assessment ID, and a percentage range
  in one domain. All filtering and sorting happen in SQL.
- The queue page shows a band for each domain. Filters are kept in the URL, and the page has
  loading, error and empty states. It meets WCAG 2.1 AA, with a light and a dark palette.
- Scoring, loading, the endpoints and the web data layer were all written test-first: 48 api
  tests, some of them against a real Postgres, and 31 web tests.

**Cut:** opening an assessment, issuing it, correcting a summary, clinician identity and the
audit log. Opening and issuing are part of the minimum path, so **the path does not work end
to end yet.** I built the queue and filters properly before starting the detail and issue
steps, and I ran out of time. With hindsight, I should have built a rough version of the whole
path first and then improved the queue.

**Main decisions:**

- **Postgres, not files.** The db service was already provided, the queue has to be filtered,
  and audit records need to be queried.
- **Scores are calculated when the data loads and stored as columns.** The brief says the
  service "holds years of them", so the queue has to filter and sort in SQL instead of
  rescoring every row in Python on each request. The raw items stay stored as the source of
  truth, and a reload recalculates the scores, so a change to the scoring rules is applied by
  restarting the api.
- **The queue sends no client PII.** It returns the ID, the date, the clinician, the flag and
  the scores, and nothing from `client`.
- **Mock identity for the audit log (planned).** The reviewer would pick a clinician from a
  list, with no login. The audit log would record both views and changes, because the brief
  asks "who looked at what", not only who changed what.
- **A separate `_test` database.** At first the test suite truncated the same database the app
  loads into, so every run of `verify.sh` emptied the queue. The tests now use their own
  database.

## Where the brief is unclear, incomplete or wrong

- **Uncompleted items in the domain mean.** "Mean of raw / max across its items" doesn't say
  what to do with `raw: null`. Counting them as 0 would lower a young person's score because
  they didn't answer. I left them out of the mean, since the review flag already reports
  incompleteness. 2.2% of items are null. Two domains have no completed items at all, and they
  show as "Not assessed" instead of 0% Minimal.
- **Band edges.** The ranges 0–39, 40–54, and so on only cover whole numbers, but percentages
  can be fractions, such as 39.5. I treated the ranges as half-open (`< 40` is Minimal).
- **"Fixed once issued" and "correct typos afterwards" contradict each other.** My plan: the
  issued version never changes, a correction creates a new version of the summary that is
  recorded in the audit log, and the report shows both. The brief doesn't say whether a
  correction means the family, school and GP get new copies.
- **Scores "are subject to change" but issued reports are fixed.** An issued report has to keep
  the percentages, bands and flag it was issued with, so issuing should save a copy of them.
  Recalculation should only apply to reports that haven't been issued.
- **What the queue contains.** "Drawn from everything the service holds": should issued reports
  leave the queue? I assumed they would, once issuing exists.
- **"Cut it down by how an assessment scored"** could mean band, percentage, flag or overall
  score. I chose a percentage range in one chosen domain.
- **Dates and time zones.** `assessed_at` is a UTC timestamp. The date filters use the UK
  calendar day (`Europe/London`), because that's the date a UK clinician would expect. The age
  should use the same day once it is shown.
- **"Under 200 characters"** is taken as `len(summary) < 200`, with whitespace counted.
- **`safeguarding_notes`** appears in the example record but not in the field list. It is the
  most sensitive field (for example, "Father not to be given dates"). The brief doesn't say who
  may see it or whether it belongs in issued copies. I never send it to the browser.
- **Scale.** The brief says the service holds years of data but asks for no paging. The queue
  returns every matching row (see below).

## Where I overrode, rewrote or threw away the agent's work

I worked with Claude Code one step at a time and reviewed each step before it moved on. My
recurring corrections are written up as rules in `agent/rules/`, so they carry over to later
sessions. The full transcripts are in `agent/transcripts/`.

- **api structure.** The agent started with a flat `main.py`, `models.py` and `scoring.py`. I
  had it restructured into feature folders under `src/`, each split by job: `model.py` for
  data, `service.py` for decisions, `store.py` for SQL, `routes.py` for HTTP. I moved functions
  out of `model.py`, renamed `repository.py` to `store.py`, and renamed `middleware/` to
  `clients/`.
- **Stored scores.** The agent's first note said scores should be calculated on every request
  and never stored. When we built the loader, it pointed out that SQL filtering needs them
  stored, and I agreed.
- **Tests.** I made test data live in fixtures instead of being built inside each test, and
  made it a rule that a failing test gets a code fix, not an edited test, unless the test
  itself is wrong.
- **Comments.** I removed docstrings and header comments that only repeated the code.
- **web structure.** I set the folder layout myself (`components/`, `services/`, `pages/`,
  `types/`, `utils/`, `assets/`, colocated `.type.ts` files), plus import aliases. I replaced
  an inline `import.meta.env.VITE_API_URL ?? ...` with a tested `getApiUrl` helper, and moved
  all state and logic out of components into colocated hooks (`useFilterPanel`, `useTooltip`),
  split into smaller hooks where they mixed concerns.
- **Styling.** I switched CSS to SCSS modules and replaced fixed `px` sizes with relative ones
  (the logo scales with the screen). I added an accessibility rule, replaced native `title`
  tooltips with styled ones, and changed band colours twice: "Substantial" looked like a
  selected button, and "Moderate" clashed with "Needs review".
- **Tooling.** I split `verify.sh` into smaller scripts in `scripts/` and added the test suites
  and lint to it.

## What I know is broken or weak

- **The minimum path is incomplete:** there's no assessment detail page, no issuing and no
  audit log.
- **No paging.** `GET /assessments` returns every matching row. That's fine for 100 rows but
  not for years of data. It needs keyset paging on `(review_flag, assessed_at)`.
- **One database connection per request, with no pool.**
- **Stored scores can go stale.** If the scoring rules change, the stored values are wrong
  until the api restarts. This is acceptable because nothing is issued yet, but issued reports
  will need the saved copy described above.
- **`age_at` is written and tested but not used,** because the detail page that would show the
  age doesn't exist yet.
- **Dev only:** on WSL, Vite sometimes reads a file while the editor is still saving it and
  serves an empty module ("does not provide an export named 'default'"). Saving the file again
  fixes it.
- **`agent/decisions.md` has some stale details.** One entry is duplicated, and a few entries
  mention old paths (`web/public/` logos, `theme.css`).

## Time

About 5 hours in total, spread over three sittings.

| | |
|---|---|
| ~45 min | harness fixes (the rollup/musl lockfile crash, `verify.sh` permissions), reading the brief, deciding the architecture, writing the agent rules |
| ~1 h 30 | api: scoring, loading into Postgres, the queue and clinicians endpoints, filters, test database |
| ~1 h | web setup: Redux/RTK Query, Vitest, ESLint/Prettier, folder layout and aliases |
| ~1 h 30 | queue page: design from neurotype.uk, accessibility, band columns, tooltips, filter panel and URL state |
| ~15 min | editor and container problems (host `node_modules`, Vite cache) |

Much of the time went on reviewing each step and setting conventions, not only on features.
That kept the code consistent, but it's also why the issue flow wasn't reached.
