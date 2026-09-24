# TypeScript conventions

- Lint with ESLint (`npm run lint`, config in `web/eslint.config.js`), format with Prettier
  (`npm run format`, config in `web/.prettierrc.json`). Run both through the container:
  `docker compose exec web npm run lint`. `./verify.sh` fails on lint errors or unformatted files.
- `strict` mode stays on (already set in `web/tsconfig.json`). No `any` — use `unknown` and
  narrow, or type the value properly.
- Let inference do the work for local variables; annotate function parameters, return types on
  exported functions, and anything the compiler can't figure out on its own.
- `type` for data shapes and unions, `interface` only when something needs to be extended or
  implemented.
- Types and interfaces live in their own files next to the file that owns them:
  `<name>.type.ts` for `type`s, `<name>.interface.ts` for `interface`s (e.g.
  `services/assessments/queueItem.type.ts`). This includes component props (`QueuePage.type.ts`).
- No non-null assertions (`!`) to silence the compiler — handle the `undefined`/`null` case or
  narrow properly.
