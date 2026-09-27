import pytest

from src.assessments.store import load_jsonl


@pytest.fixture
def records_by_three_clinicians(record: dict) -> list[dict]:
    return [
        {**record, "assessment_id": "a-1", "clinician_id": "c-009"},
        {**record, "assessment_id": "a-2", "clinician_id": "c-002"},
        {**record, "assessment_id": "a-3", "clinician_id": "c-009"},
        {**record, "assessment_id": "a-4", "clinician_id": "c-004"},
    ]


def test_clinicians_lists_each_clinician_once_sorted(
    client, conn, jsonl_file, records_by_three_clinicians
):
    load_jsonl(conn, jsonl_file(records_by_three_clinicians))

    response = client.get("/clinicians")

    assert response.status_code == 200
    assert response.json() == ["c-002", "c-004", "c-009"]


def test_clinicians_is_tagged_in_openapi(client):
    assert client.get("/openapi.json").json()["paths"]["/clinicians"]["get"]["tags"] == [
        "clinicians"
    ]
