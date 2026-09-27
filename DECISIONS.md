# Decisions

## What I built, what I cut, and why

**Built:** The first half of the minimum path from the brief. This includes the reviewer opening the queue and narrowing it down.

- The api loads `assessments.jsonl` into Postgres on startup. An upsert is used to prevent duplicates on restarts, and each assessment is scored as it is loaded in.
- The first endpoint (`GET /assessments`) returns the queue. Flagged assessments are displayed first, then oldest to latest assessments. It filters by review flag, clinician ID, assessed date range, assessment ID, and a percentage range in one domain. All filtering and sorting happens in the data side using SQL.
- The queue page shows a band for each domain: minimal, mild, moderate and substantial. Filters are kept in the URL to allow users to share links and save results. The page uses skeletons whilst loading, handles some errors and handles empty states. 
- WCAG 2.1 AA guidelines were followed and a light and dark theme are used.
- The code was written test-first including the data, endpoints and frontend.

**Cut:** Opening an assessment, issuing it, correcting a summary, clinician details and the audit log. The path does not work end-to-end if were following the minimum path which includes opening and issuing the assessment. This was mainly because I focused my time on building the queue and filters, and some time on getting the project ready with proper set conventions.

**Main decisions:**

- Postgres as DB - Kept this as using a relational database means we can create uniform, structured data, it's highly reliable and free to use.
- Scores are calculated when the data loads and stored as columns - Due to time constraints, we loaded in the data into a postgresql table over creating a volume for the db service which allowed us to filter and sort using SQL but did mean restarting the docker container for instance would reload the data in, instead of keeping it persistent. Reloading the data meant that changes in the scoring rules could be applied when the API was restarted.
- Personal identifiable information isn't sent to the queue - Only the IDs, the date, the flag and the scores were returned.

## Where the brief is unclear, incomplete or wrong

- How to handle incomplete data - As only 2.2% of items were null and there's a flag for incomplete reports, incomplete items were just left out of the mean instead of using mean, mode or median imputation for instance. Two domains have no completed items at all and they show as "Not assessed".
- Band boundaries - The ranges 0–39, 40–54, and so on only cover whole numbers, but percentages can be fractions, such as 39.5. I treated the ranges as half-open (< 40 is Minimal).
- Issued reports in the queue - Whether issued reports should leave the queue or not. I assumed they would once they have been issued.
- Specific filters, pagination and queue design - The brief says the service holds years of data but doesn't mention about pagination. The queue currently returns every matching row, but pagination would be included in future versions. 
- Scores "are subject to change" but issued reports are fixed - An issued report has to keep the percentages, bands and flag it was issued with, so issuing should save a copy of them. However, recalculation only seems to be applied to reports that haven't been issued yet and there's no mention of how this will be handled. For now, it is assumed that issued reports cannot be recalculated.
- Handling safeguarding notes - These appear in the example record but not in the field list. It is the most sensitive field but The brief doesn't explain who can see it or whether issued reports should contain it. For now, it has not been returned in the endpoint response.
- No mentioned of authorisation or login functionality - For issuing reports, even seeing the queue, we need to have proper authentication and authorisation to ensure only the relevant parties can view the data and enable us to restruict access to certain features e.g. views for clients in the future and serparate views for managers. 

## Where I overrode, rewrote or threw away the agent's work

Claude code handled most of the code generation and I ensured each task was broken down into smaller steps which I could manage and review step by step. I like to ensure the agent doesn't make the same mistakes again by keeping conventions I like to follow as rules in `agent/rules/`. Claude has been specifically told to keep these in mind, and skills and hooks can be created to ensure these are followed and remembered for future sessions. In this way I like keep smaller, more frequent newer sessions and have all the context provided in these files.

- API folder structure - The agent started with a flat `main.py`, `models.py` and `scoring.py`. I like to follow a feature folder structure so had these all under a `src/` folder, and split into feature folders with their own `model.py` for data, `service.py` for decisions, `store.py` for SQL queries and `routes.py` for HTTP configuration. I added a folder called `clients/` to hold configurations like database connections and third-party connections. 
- React folder structure - I like to separate stateful logic and functions from the React component itself by using hooks, colocate files, and prefer using SASS over CSS for styling to allow styling to be reused across files. I corrected the agent several times so that it aligned better with how I like to write code.
- Use of test fixtures - I made test data live in fixtures instead of being built inside each test, and made it a rule that a failing test gets a code fix, not an edited test, unless the test itself is wrong. This is to try to prevent the agent from over-engineering the problem and unnecessarily changing tests to match its code which defeats the point of the tests. 
- When to add comments - I prefer to have my code act as the comments so removed docstrings and header comments that only repeated what the code was telling which is a common thing that AI agents do.
- Verification - To help the agent verify its work better and make the scripts more readable, I split `verify.sh` into smaller scripts in `scripts/` and added the test suites and lint to it. I would ask the agent to ensure it checks this after its finished with its changes. My tests ensure the code is correct, my linting and formatting help with code quality and additional checks can also be added to protect the codebase.

## What I know is broken or weak

- The minimum path is incomplete - There's no assessment detail page, no issuing and no audit log which were mentioned in the minimum path.
- Design and more UI friendly features - Things like Pagination for the table and better filter design would ensure the features are easier to use and scalable with the data.
- Not hosted - The app, api and database only run locally through `docker compose up`, so nobody else can use it or share the same data. A real deployment would need the app and api hosted behind HTTPS, and a managed Postgres (e.g. Neon, Supabase or RDS) with TLS, proper credentials kept out of the repo, and restricted access, since the records hold NHS numbers, guardian contacts and safeguarding notes. The tests would also need to keep running against a local database, as they create and truncate their own tables.
- No login - There is no authentication, so anyone who can reach the app sees every assessment. Ideally proper sign-in (e.g. the NHS's single sign-on or the organisation's identity provider) and role-based access would be one of the first built features if were following a proper end-to-end journey.
- No monitoring - We have `/health` and a single `print` when the data loads, so a slow query, a failed load or a spike in errors would go unnoticed. A hosted version, especially a production system, would need structured logging (with personally-identifiable data kept out of the logs), error tracking (e.g. Sentry), metrics and alerts on request latency and error rates, and a health check that also confirms the database is reachable, since `/health` currently returns 200 even when Postgres is down.

## Time

I spent around 5 hours in total, spread across 3 sittings. Much of this time was spent reviewing generated code, making adjustments, setting conventions and setting up the codebase whilst building out the features. This contributed to the slowness in the code development but also ensures code quality is prioritised, and time is taken to set things up properly to help protect the codebase too. 

| | |
|---|---|
| ~45 min | harness fixes (the rollup/musl lockfile crash, `verify.sh` permissions), reading the brief, deciding the architecture, writing the agent rules |
| ~1 h 30 | starting on the api: scoring, loading into Postgres, the queue and clinicians endpoints, filters, test database |
| ~1 h | setting up the react app: Redux/RTK Query, Vitest, ESLint/Prettier, folder layout and aliases |
| ~1 h 30 | creating the queue page: design from neurotype.uk, accessibility, band columns, tooltips, filter panel and URL state |
