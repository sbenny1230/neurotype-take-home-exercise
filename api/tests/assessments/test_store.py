"""Integration tests against a real Postgres — DATABASE_URL must point at one
(docker-compose.yml provides it inside the api container). Runs against its own
<DATABASE_URL>_test database (see conftest.py), never the app's real data."""

import pytest

from src.assessments.store import load_jsonl

@pytest.fixture
def reassigned_record(record: dict) -> dict:
    return {**record, "clinician_id": "c-099"}


def test_load_jsonl_inserts_row_with_computed_scoring(conn, jsonl_file, record):
    path = jsonl_file([record])

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


def test_load_jsonl_is_idempotent_on_reload(conn, jsonl_file, record):
    path = jsonl_file([record])
    load_jsonl(conn, path)
    count = load_jsonl(conn, path)

    assert count == 1
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM assessments")
        (total,) = cur.fetchone()
    assert total == 1


def test_load_jsonl_upserts_changed_fields(conn, jsonl_file, record, reassigned_record):
    path = jsonl_file([record])
    load_jsonl(conn, path)

    path = jsonl_file([reassigned_record])
    load_jsonl(conn, path)

    with conn.cursor() as cur:
        cur.execute("SELECT clinician_id FROM assessments WHERE assessment_id = %s", ("a-test-1",))
        (clinician_id,) = cur.fetchone()
    assert clinician_id == "c-099"
