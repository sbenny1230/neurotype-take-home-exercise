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
    components/   reusable components (used by more than one page)
    styles/       shared styles (theme variables, base styles)
    services/     RTK Query APIs: one file per backend feature, calling its endpoints
    features/     Redux slices
    utils/        small shared helpers (e.g. apiUrl.ts: the api base URL)
    pages/        one folder per URL, holding that page's component, styles and parts
    store.ts      Redux store
  tests/          end-to-end tests (sits next to src/, not inside it)
```

- Colocate: a file's types (`.type.ts`), interfaces (`.interface.ts`), styles
  (`.module.css`) and unit tests (`.test.ts` / `.test.tsx`) sit next to it.
- Create a folder when its first file lands. Don't add empty folders ahead of time.

Language-specific conventions: [python.md](python.md), [typescript.md](typescript.md),
[react.md](react.md).
