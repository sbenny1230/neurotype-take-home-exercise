import pytest
from fastapi.testclient import TestClient

from src.assessments.routes import get_db
from src.assessments.store import load_jsonl
from src.main import app
from tests.assessments.test_store import RECORD


@pytest.fixture
def client(conn):
    app.dependency_overrides[get_db] = lambda: conn
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_queue_lists_assessments_oldest_first(client, conn, jsonl_file):
    newer = {**RECORD, "assessment_id": "a-newer", "assessed_at": "2026-05-01T09:00:00+00:00"}
    older = {**RECORD, "assessment_id": "a-older", "assessed_at": "2025-01-01T09:00:00+00:00"}
    load_jsonl(conn, jsonl_file([newer, older]))

    response = client.get("/assessments")

    assert response.status_code == 200
    assert [row["assessment_id"] for row in response.json()] == ["a-older", "a-newer"]


def test_queue_rows_carry_review_fields_and_no_client_pii(client, conn, jsonl_file):
    load_jsonl(conn, jsonl_file([RECORD]))

    (row,) = client.get("/assessments").json()

    assert row == {
        "assessment_id": "a-test-1",
        "clinician_id": "c-005",
        "assessed_at": "2026-03-02T09:30:00Z",
        "review_flag": True,
    }
