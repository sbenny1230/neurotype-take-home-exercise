"""Dataclasses for a parsed assessment record (data/assessments.jsonl shape)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime


@dataclass(frozen=True)
class Item:
    code: str
    raw: int | None
    max: int
    completed: bool


@dataclass(frozen=True)
class Domain:
    domain: str
    items: list[Item]


@dataclass(frozen=True)
class Client:
    date_of_birth: date
    nhs_number: str
    guardian_contact: str
    safeguarding_notes: str | None = None


@dataclass(frozen=True)
class Assessment:
    assessment_id: str
    client: Client
    assessed_at: datetime
    clinician_id: str
    domains: list[Domain]
    summary: str


def parse_assessment(data: dict) -> Assessment:
    """Parse one decoded JSON object from data/assessments.jsonl."""
    client_data = data["client"]
    client = Client(
        date_of_birth=date.fromisoformat(client_data["date_of_birth"]),
        nhs_number=client_data["nhs_number"],
        guardian_contact=client_data["guardian_contact"],
        safeguarding_notes=client_data.get("safeguarding_notes"),
    )
    domains = [
        Domain(domain=d["domain"], items=[Item(**item) for item in d["items"]])
        for d in data["domains"]
    ]
    return Assessment(
        assessment_id=data["assessment_id"],
        client=client,
        assessed_at=datetime.fromisoformat(data["assessed_at"]),
        clinician_id=data["clinician_id"],
        domains=domains,
        summary=data["summary"],
    )
