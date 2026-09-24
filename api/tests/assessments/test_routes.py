import pytest
from fastapi.testclient import TestClient

from src.assessments.routes import get_db
from src.assessments.store import load_jsonl
from src.main import app


@pytest.fixture
def client(conn):
    app.dependency_overrides[get_db] = lambda: conn
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def mixed_flag_records(record: dict) -> list[dict]:
    unflagged_domains = [
        {
            "domain": "social_communication",
            "items": [{"code": "SC1", "raw": 5, "max": 20, "completed": True}],
        }
    ]

    def dated(assessment_id: str, assessed_at: str, flagged: bool) -> dict:
        domains = record["domains"] if flagged else unflagged_domains
        return {**record, "assessment_id": assessment_id, "assessed_at": assessed_at, "domains": domains}

    return [
        dated("unflagged-older", "2024-01-01T09:00:00+00:00", flagged=False),
        dated("flagged-newer", "2026-05-01T09:00:00+00:00", flagged=True),
        dated("unflagged-newer", "2026-06-01T09:00:00+00:00", flagged=False),
        dated("flagged-older", "2025-01-01T09:00:00+00:00", flagged=True),
    ]


def test_queue_lists_flagged_first_then_oldest(client, conn, jsonl_file, mixed_flag_records):
    load_jsonl(conn, jsonl_file(mixed_flag_records))

    response = client.get("/assessments")

    assert response.status_code == 200
    assert [row["assessment_id"] for row in response.json()] == [
        "flagged-older",
        "flagged-newer",
        "unflagged-older",
        "unflagged-newer",
    ]


def test_queue_rows_carry_review_fields_and_no_client_pii(client, conn, jsonl_file, record):
    load_jsonl(conn, jsonl_file([record]))

    (row,) = client.get("/assessments").json()

    assert row == {
        "assessment_id": "a-test-1",
        "clinician_id": "c-005",
        "assessed_at": "2026-03-02T09:30:00Z",
        "review_flag": True,
    }
