"""Domain scoring, banding, review flag, and age — none of this is in the
data file, it's the instrument definition from the brief."""

from __future__ import annotations

from datetime import date, datetime

from src.assessments.model import Assessment, Band, Client, Domain, DomainScore, Item

SUMMARY_MIN_LENGTH = 200


def domain_percentage(domain: Domain) -> float | None:
    completed = [item for item in domain.items if item.completed and item.raw is not None]
    if not completed:
        return None
    return sum(item.raw / item.max * 100 for item in completed) / len(completed)


def band_for_percentage(percentage: float) -> Band:
    if percentage < 40:
        return Band.MINIMAL
    if percentage < 55:
        return Band.MILD
    if percentage < 85:
        return Band.MODERATE
    return Band.SUBSTANTIAL


def review_flag(assessment: Assessment) -> bool:
    has_uncompleted_item = any(
        not item.completed for domain in assessment.domains for item in domain.items
    )
    has_substantial_domain = any(
        (pct := domain_percentage(domain)) is not None and band_for_percentage(pct) == Band.SUBSTANTIAL
        for domain in assessment.domains
    )
    summary_too_short = len(assessment.summary) < SUMMARY_MIN_LENGTH
    return has_uncompleted_item or has_substantial_domain or summary_too_short


def age_at(date_of_birth: date, assessed_at: date) -> tuple[int, int]:
    years = assessed_at.year - date_of_birth.year
    months = assessed_at.month - date_of_birth.month
    if assessed_at.day < date_of_birth.day:
        months -= 1
    if months < 0:
        years -= 1
        months += 12
    return years, months


def domain_scores(assessment: Assessment) -> dict[str, DomainScore]:
    scores = {}
    for domain in assessment.domains:
        pct = domain_percentage(domain)
        band = band_for_percentage(pct).value if pct is not None else None
        scores[domain.domain] = DomainScore(percentage=pct, band=band)
    return scores


def parse_assessment(data: dict) -> Assessment:
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
