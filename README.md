# Neurotype take-home: starter harness

**Using this is optional.** It exists so that nobody spends an hour of a four hour
exercise on container plumbing. If you would rather set the whole thing up
yourself, do that instead: we care about the contract below, not about this
particular scaffold.

## Getting it up

```bash
docker compose up
./verify.sh          # in another terminal
```

Then open http://localhost:5173. The page should say the API is up. The first
run builds two images, so give it a couple of minutes; `verify.sh` waits.

## The contract

Whatever you build, however you build it, these three things have to be true when
you send it back. They are what we run against, and they are all we require.

| | |
|---|---|
| `docker compose up` | brings the whole thing up on a machine with only Docker installed |
| `http://localhost:8000/health` | returns 200 |
| `http://localhost:5173` | serves the app |

`verify.sh` checks the last two, once you have started the stack yourself. It
also warns, without failing, if the api is not sending CORS headers for the web
origin: that combination passes both checks above and still gives you a page
with no data on it.

If it passes on a clean clone of your repository, you are fine.

## What is in here, and what you should do to it

Almost nothing, on purpose.

- **`api/`** is stdlib Python serving `/health` and nothing else. There is no
  framework here because we are not suggesting one. Delete `main.py`, add
  FastAPI or Flask or Django or Litestar to `requirements.txt`, and go. Keep
  port 8000, keep `/health`, and keep CORS on for `http://localhost:5173`:
  the web app is a different origin and the browser will block it otherwise.
- **`web/`** is a bare Vite + React + TypeScript app. No router, no component
  library, no state management, no styling. Add whatever you like.
- **`db`** is a Postgres service, wired up and healthchecked, because otherwise
  you would spend twenty minutes doing that. If you would rather use SQLite, or
  DuckDB, or files on disk, delete the service and the `depends_on` block. That
  is not a wrong answer and we will not read it as one. It has no volume, so
  `docker compose down` throws the data away; add one if you want it kept.
- **`data/assessments.jsonl`** is the sample of a hundred assessments, one JSON
  object per line. It is mounted read-only into the api container at
  `/data/assessments.jsonl` and the path is in `DATA_FILE`. Nothing reads it yet.
- **`verify.sh`** is the same script we run. Feel free to extend it.

Both services mount their source as a volume, so edits show up without a
rebuild.

**Dependencies.**

| | |
|---|---|
| api, new package in `requirements.txt` | `docker compose up --build api` |
| web, new package in `package.json` | `docker compose restart web` |

The web one is not a typo and `--build` is not the answer. `node_modules` lives
in a volume rather than in the image, so it survives a rebuild and shadows the
image layer: `--build` alone installs the package into a directory nothing ever
reads. The container runs `npm install` on start instead, so restarting it is
what picks the package up.

## Things worth knowing

- Ports are 8000 and 5173 because they have to be something. If you need to
  change them, change `verify.sh` too and say so in your README.
- There is no test runner wired up. Wire up whatever you use.
- There is no CI. You do not need any.
- `npm run build` runs `tsc` over `web/src`. It passes on a clean checkout, so
  it is usable as a check gate from the first commit.
- The harness has no domain code in it at all. Nothing here is a hint about how
  to model the problem.

## If Docker is not something you have used

That is fine, and it is why this exists. You should be able to get to a running
stack with `docker compose up` and never open these files. The two commands
above are genuinely the whole thing; if they do not work on a clean checkout,
email us rather than losing an hour to it.
