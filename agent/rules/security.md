# Security

- `data/assessments.jsonl` contains real-shaped PII per record: `date_of_birth`, `nhs_number`,
  `guardian_contact`. Treat it as sensitive: don't log full records, don't write it to derived
  files that get committed, and don't send fields to the browser that the feature doesn't need
  to display.
- CORS: keep `Access-Control-Allow-Origin` scoped to `WEB_ORIGIN` (`http://localhost:5173`).
  Never widen it to `*`.
- Secrets stay out of the repo. `.env` is git-ignored and already denied to file-read tools via
  `.claude/settings.json`, along with `*.pem`, `*.key`, `~/.ssh/**` — keep new secret-bearing
  paths added to that deny list too.
- Review new dependencies before adding them (`requirements.txt` / `package.json`) — prefer
  well-maintained packages over ones that pull in large, unaudited trees.
