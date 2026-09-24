from __future__ import annotations

import psycopg

from src.config import get_settings


def get_connection() -> psycopg.Connection:
    # ponytail: a fresh connection per call, no pooling — fine at this scale,
    # add a pool (psycopg_pool) if concurrent request volume makes it an issue.
    return psycopg.connect(get_settings().database_url)
