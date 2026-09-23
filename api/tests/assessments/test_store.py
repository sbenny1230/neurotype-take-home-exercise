"""Integration tests against a real Postgres — DATABASE_URL must point at one
(docker-compose.yml provides it inside the api container)."""

import json

import pytest

from src.assessments.store import create_schema, load_jsonl
from src.utils.db import get_connection


@pytest.fixture
def conn():
    with get_connection() as connection:
        create_schema(connection)
        with connection.cursor() as cur:
            cur.execute("TRUNCATE assessments")
        connection.commit()
        yield connection
        with connection.cursor() as cur:
            cur.execute("TRUNCATE assessments")
        connection.commit()


@pytest.fixture
def jsonl_file(tmp_path):
    def _write(records: list[dict]) -> str:
        path = tmp_path / "assessments.jsonl"
        path.write_text("\n".join(json.dumps(r) for r in records))
        return str(path)

    return _write


RECORD = {
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


def test_load_jsonl_inserts_row_with_computed_scoring(conn, jsonl_file):
    path = jsonl_file([RECORD])

    count = load_jsonl(conn, path)

    assert count == 1
    with conn.cursor() as cur:
        cur.execute(
            "SELECT clinician_id, review_flag, domain_scores FROM assessments WHERE assessment_id = %s",
            ("a-test-1",),
        )
        clinician_id, flag, scores = cur.fetchone()
    assert clinician_id == "c-005"
    assert flag is True  # SC2 uncompleted -> flagged
    assert scores["social_communication"]["percentage"] == 95.0  # mean over completed items only
    assert scores["social_communication"]["band"] == "substantial"


def test_load_jsonl_is_idempotent_on_reload(conn, jsonl_file):
    path = jsonl_file([RECORD])
    load_jsonl(conn, path)
    count = load_jsonl(conn, path)

    assert count == 1
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM assessments")
        (total,) = cur.fetchone()
    assert total == 1


def test_load_jsonl_upserts_changed_fields(conn, jsonl_file):
    path = jsonl_file([RECORD])
    load_jsonl(conn, path)

    updated = {**RECORD, "clinician_id": "c-099"}
    path = jsonl_file([updated])
    load_jsonl(conn, path)

    with conn.cursor() as cur:
        cur.execute("SELECT clinician_id FROM assessments WHERE assessment_id = %s", ("a-test-1",))
        (clinician_id,) = cur.fetchone()
    assert clinician_id == "c-099"
