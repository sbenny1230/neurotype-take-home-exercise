import json

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg import sql

from src.assessments.store import create_schema
from src.clients.db import get_db
from src.config import get_settings
from src.main import app

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


@pytest.fixture
def client(conn):
    app.dependency_overrides[get_db] = lambda: conn
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def record() -> dict:
    return {
        "assessment_id": "a-test-1",
        "client": {
            "date_of_birth": "2014-03-02",
            "nhs_number": "999 476 5919",
            "guardian_contact": "j.okafor@example.com",
        },
        "assessed_at": "2026-03-02T09:30:00+00:00",
        "clinician_id": "c-005",
        "domains": [
            {
                "domain": "social_communication",
                "items": [
                    {"code": "SC1", "raw": 19, "max": 20, "completed": True},
                    {"code": "SC2", "raw": None, "max": 20, "completed": False},
                ],
            }
        ],
        "summary": "x" * 250,
    }
