import json

import psycopg
import pytest
from psycopg import sql

from src.assessments.store import create_schema
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


@pytest.fixture
def conn():
    with psycopg.connect(TEST_DATABASE_URL) as connection:
        create_schema(connection)
        connection.execute("TRUNCATE assessments")
        connection.commit()
        yield connection
        connection.execute("TRUNCATE assessments")
        connection.commit()


@pytest.fixture
def jsonl_file(tmp_path):
    def _write(records: list[dict]) -> str:
        path = tmp_path / "assessments.jsonl"
        path.write_text("\n".join(json.dumps(r) for r in records))
        return str(path)

    return _write
