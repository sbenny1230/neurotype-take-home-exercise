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

Language-specific conventions: [python.md](python.md), [typescript.md](typescript.md),
[react.md](react.md).
