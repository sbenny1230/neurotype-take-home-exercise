# React conventions

- Function components with hooks only. No class components.
- API calls go through RTK Query in `src/services/`. There is one `createApi` instance
  (`services/baseApi.ts`); each backend feature adds its endpoints with
  `baseApi.injectEndpoints` in its own folder (`services/assessments/assessmentsApi.ts`).
  State shared between components goes in Redux slices in `src/features/`. State used by a
  single component stays in `useState`.
- Keep components small and split by responsibility. Page-specific parts stay in that page's
  folder; move a component to `src/components/` once a second page actually uses it.
- Derive values during render instead of syncing them into state with `useEffect`. Reserve
  `useEffect` for actual side effects (fetches, subscriptions).
- Type props explicitly (a `Props` type in the component's `.type.ts` file). No implicit `any`
  from untyped props.
- Keys in lists must be stable IDs from the data (e.g. `assessment_id`), never array index.
