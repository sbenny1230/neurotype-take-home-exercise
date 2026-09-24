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


@dataclass(frozen=True)
class QueueItem:
    assessment_id: str
    clinician_id: str
    assessed_at: datetime
    review_flag: bool
