# Accessibility

The web app meets WCAG 2.1 level AA. Check these on every UI change:

- **Relative sizing (1.4.4 Resize text, 1.4.10 Reflow).** Size text, spacing and images in `rem`
  / `em`, scaling with the screen through `clamp()` / `vw` where it helps (e.g. the header logo).
  No fixed `px` sizes, except 1–2px hairlines (borders, focus outlines). The page must work at
  200% zoom and at 320px wide without horizontal scrolling, except inside data tables.
- **Contrast (1.4.3, 1.4.11).** Text at least 4.5:1 against its background (3:1 for text 24px+
  or 18.66px+ bold). Focus indicators and the edges of controls at least 3:1. Check both the
  light and dark palettes in `styles/theme.scss` when adding or changing a colour.
- **Not colour alone (1.4.1).** Status is written out in words (e.g. "Needs review"), with
  colour only as a second signal.
- **Keyboard (2.1.1, 2.4.7).** Every action works from the keyboard using native elements
  (`<button>`, `<a>`), never click handlers on `<div>`s. Focus is always visible
  (`:focus-visible` outline).
- **Semantics (1.3.1, 4.1.2).** Use real structure: one `<h1>` per page, `<header>` / `<main>`,
  tables with `<th scope>`. Images have `alt` text; decorative elements get
  `aria-hidden="true"`.
- **Status messages (4.1.3).** Loading uses `role="status"` and errors use `role="alert"`, so
  screen readers announce them without moving focus.
- **Motion (2.3.3, best practice at AA).** Animations stop under
  `prefers-reduced-motion: reduce`.
- Tests find elements by role and accessible name (`getByRole('button', { name: 'Retry' })`),
  which also checks that the semantics are right.
