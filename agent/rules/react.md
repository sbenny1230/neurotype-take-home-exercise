# React conventions

- Function components with hooks only. No class components.
- State lives at the component that owns it; lift only when a sibling actually needs it. Don't
  reach for a state library until plain `useState`/`useContext` stops being enough.
- Keep components small and split by responsibility, not by anticipated reuse — don't extract a
  shared component until there's a second real caller.
- Derive values during render instead of syncing them into state with `useEffect`. Reserve
  `useEffect` for actual side effects (fetches, subscriptions).
- Type props explicitly (a `type Props = {...}` next to the component). No implicit `any` from
  untyped props.
- Keys in lists must be stable IDs from the data (e.g. `assessment_id`), never array index.
