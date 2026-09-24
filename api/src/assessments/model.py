from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from typing import Literal, Self

from pydantic import BaseModel, Field, model_validator

DomainName = Literal[
    "social_communication",
    "sensory_processing",
    "executive_function",
    "emotional_regulation",
    "motor_coordination",
]


class Band(str, Enum):
    MINIMAL = "minimal"
    MILD = "mild"
    MODERATE = "moderate"
    SUBSTANTIAL = "substantial"


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
class DomainScore:
    percentage: float | None
    band: str | None


@dataclass(frozen=True)
class QueueItem:
    assessment_id: str
    clinician_id: str
    assessed_at: datetime
    review_flag: bool
    domain_scores: dict[str, DomainScore]


class QueueFilters(BaseModel):
    review_flag: bool | None = None
    clinician_id: str | None = None
    assessed_from: date | None = None
    assessed_to: date | None = None
    search: str | None = None
    score_domain: DomainName | None = None
    score_min: float | None = Field(default=None, ge=0, le=100)
    score_max: float | None = Field(default=None, ge=0, le=100)

    @model_validator(mode="after")
    def check_ranges(self) -> Self:
        if self.assessed_from and self.assessed_to and self.assessed_from > self.assessed_to:
            raise ValueError("assessed_from must be on or before assessed_to")
        if (self.score_min is not None or self.score_max is not None) and not self.score_domain:
            raise ValueError("score_min and score_max need a score_domain")
        if (
            self.score_min is not None
            and self.score_max is not None
            and self.score_min > self.score_max
        ):
            raise ValueError("score_min must be at most score_max")
        return self
