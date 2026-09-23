from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    web_origin: str
    data_file: str
    database_url: str


@lru_cache
def get_settings() -> Settings:
    return Settings(
        web_origin=os.environ.get("WEB_ORIGIN", "http://localhost:5173"),
        data_file=os.environ.get("DATA_FILE", "/data/assessments.jsonl"),
        database_url=os.environ.get("DATABASE_URL", ""),
    )
