# Python conventions

- Type hints on every function signature. Run mypy (or the linter's type checker) as part of
  the check gate once one is wired up.
- Format with `black`, lint with `ruff` (or whatever is actually added to `requirements.txt` —
  update this line to match, don't leave it aspirational).
- Prefer plain functions over classes; reach for a class only when there's real state to carry
  between calls (e.g. a client wrapper), not for namespacing.
- Use `dataclasses` or pydantic models for structured data (e.g. a parsed assessment record)
  instead of passing dicts around.
- Raise specific exceptions, not bare `Exception`. Let unexpected errors propagate rather than
  swallowing them with a broad `except`.
- No mutable default arguments. No `import *`.
