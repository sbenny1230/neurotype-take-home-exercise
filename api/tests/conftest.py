import psycopg
import pytest
from psycopg import sql

from src.config import get_settings

TEST_DATABASE_URL = get_settings().database_url + "_test"


@pytest.fixture(scope="session", autouse=True)
def _test_database():
    db_name = TEST_DATABASE_URL.rsplit("/", 1)[-1]
    with psycopg.connect(get_settings().database_url, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (db_name,)
        ).fetchone()
        if not exists:
            conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
