# TypeScript conventions

- `strict` mode stays on (already set in `web/tsconfig.json`). No `any` — use `unknown` and
  narrow, or type the value properly.
- Let inference do the work for local variables; annotate function parameters, return types on
  exported functions, and anything the compiler can't figure out on its own.
- `type` for data shapes and unions, `interface` only when something needs to be extended or
  implemented. Pick one and stay consistent within a file.
- No non-null assertions (`!`) to silence the compiler — handle the `undefined`/`null` case or
  narrow properly.
- Co-locate types with the code that uses them; only pull them into a shared file once a second
  module actually needs them.
