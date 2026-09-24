import pytest


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
