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


@pytest.fixture
def record_with_unassessed_domain(record: dict) -> dict:
    unassessed = {
        "domain": "motor_coordination",
        "items": [{"code": "MC1", "raw": None, "max": 20, "completed": False}],
    }
    return {**record, "domains": [*record["domains"], unassessed]}


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
        "domain_scores": {
            "social_communication": {"percentage": 95.0, "band": "substantial"},
        },
    }


def test_queue_row_scores_unassessed_domain_as_null(
    client, conn, jsonl_file, record_with_unassessed_domain
):
    load_jsonl(conn, jsonl_file([record_with_unassessed_domain]))

    (row,) = client.get("/assessments").json()

    assert row["domain_scores"]["motor_coordination"] == {"percentage": None, "band": None}


@pytest.fixture
def filterable_records(record: dict) -> list[dict]:
    def assessment(
        assessment_id: str, clinician_id: str, assessed_at: str, items: list[dict]
    ) -> dict:
        return {
            **record,
            "assessment_id": assessment_id,
            "clinician_id": clinician_id,
            "assessed_at": assessed_at,
            "domains": [{"domain": "social_communication", "items": items}],
        }

    def scored(raw: int) -> list[dict]:
        return [{"code": "SC1", "raw": raw, "max": 20, "completed": True}]

    unassessed = [{"code": "SC1", "raw": None, "max": 20, "completed": False}]
    return [
        assessment("a-00051", "c-001", "2025-04-03T10:30:00+00:00", scored(19)),  # 95%, flagged
        assessment("a-00059", "c-002", "2025-04-30T23:30:00+00:00", scored(5)),  # 25%, 1 May in UK
        assessment("a-00100", "c-001", "2025-05-01T09:00:00+00:00", scored(12)),  # 60%
        assessment("a-00200", "c-003", "2025-06-01T09:00:00+00:00", unassessed),  # flagged
    ]


@pytest.mark.parametrize(
    ("query", "expected_ids"),
    [
        ("", ["a-00051", "a-00200", "a-00059", "a-00100"]),
        ("review_flag=true", ["a-00051", "a-00200"]),
        ("review_flag=false", ["a-00059", "a-00100"]),
        ("clinician_id=c-001", ["a-00051", "a-00100"]),
        ("assessed_from=2025-05-01&assessed_to=2025-05-01", ["a-00059", "a-00100"]),
        ("assessed_to=2025-04-30", ["a-00051"]),
        ("search=A-0005", ["a-00051", "a-00059"]),
        ("search=%25", []),
        ("score_domain=social_communication&score_min=55&score_max=84", ["a-00100"]),
        ("score_domain=social_communication&score_min=95", ["a-00051"]),
        ("score_domain=social_communication&score_max=25", ["a-00059"]),
        ("score_domain=social_communication", ["a-00051", "a-00059", "a-00100"]),
        ("clinician_id=c-001&review_flag=false", ["a-00100"]),
    ],
)
def test_queue_filters(client, conn, jsonl_file, filterable_records, query, expected_ids):
    load_jsonl(conn, jsonl_file(filterable_records))

    response = client.get(f"/assessments?{query}")

    assert response.status_code == 200
    assert [row["assessment_id"] for row in response.json()] == expected_ids


@pytest.mark.parametrize(
    "query",
    [
        "review_flag=maybe",
        "assessed_from=2025-05-02&assessed_to=2025-05-01",
        "score_domain=reading",
        "score_domain=social_communication&score_min=-1",
        "score_domain=social_communication&score_max=101",
        "score_domain=social_communication&score_min=80&score_max=20",
        "score_min=50",
    ],
)
def test_queue_rejects_invalid_filters(client, query):
    response = client.get(f"/assessments?{query}")

    assert response.status_code == 422
