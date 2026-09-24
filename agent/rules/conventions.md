# Conventions

- Simplest solution that satisfies the requirement. No layers, abstractions, or config options
  for cases that do not exist yet.
- Code must be readable on its own: clear names, small functions, obvious control flow. Prefer
  three similar lines over a premature abstraction.
- No dead code, no commented-out code, no feature flags for things without two real callers.
- Comments only for non-obvious *why* (a workaround, a constraint from the domain data). Never
  comment what the code already says.
- Keep this file in sync with the stack once it's chosen (formatter/linter commands, file layout
  conventions, etc.).

## web layout

```
web/
  src/
    assets/       static files imported by components (logos, images)
    components/   reusable components (used by more than one page)
    styles/       shared styles (theme variables, base styles)
    services/     RTK Query APIs: one folder per backend feature (e.g. services/assessments/)
    features/     Redux slices
    types/        shared domain types (e.g. queueItem.type.ts)
    utils/        small shared helpers, one folder each (e.g. utils/getApiUrl/)
    pages/        one folder per URL, holding that page's component, styles and parts
    store.ts      Redux store
  tests/          end-to-end tests (sits next to src/, not inside it)
```

- Colocate: a file's types (`.type.ts`), interfaces (`.interface.ts`), styles
  (`.module.css`) and unit tests (`.test.ts` / `.test.tsx`) sit next to it.
- A module with colocated files (its test, types, styles) gets its own folder named after it.
  The module is a default export, and the folder's `index.ts` re-exports it
  (`export default getApiUrl`), so callers import the folder: `import getApiUrl from
  '../utils/getApiUrl'`. Example: `utils/getApiUrl/{getApiUrl.ts, getApiUrl.test.ts, index.ts}`.
- Import across top-level folders with the bare folder alias (`import type { QueueItem } from
  'types/queueItem.type'`, `import getApiUrl from 'utils/getApiUrl'`), not `../../`. Relative
  imports only within the same folder. Aliases are defined twice, in `web/tsconfig.json` "paths"
  and `web/vite.config.ts` `resolve.alias`; a new top-level folder needs adding to both.
- Create a folder when its first file lands. Don't add empty folders ahead of time.

Language-specific conventions: [python.md](python.md), [typescript.md](typescript.md),
[react.md](react.md).
