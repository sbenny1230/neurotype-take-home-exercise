"""domain_scores/review_flag are a cache of service.py's output, computed at
load time so the queue can filter/sort on them in SQL instead of rescoring
every row in Python on every request. Re-running load_jsonl recomputes and
upserts them, so a scoring-logic change is picked up by reloading."""

from __future__ import annotations

import json
from dataclasses import asdict

import psycopg

from src.assessments.model import Assessment, DomainScore, QueueFilters, QueueItem
from src.assessments.service import domain_scores, parse_assessment, review_flag

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS assessments (
    assessment_id TEXT PRIMARY KEY,
    client_date_of_birth DATE NOT NULL,
    client_nhs_number TEXT NOT NULL,
    client_guardian_contact TEXT NOT NULL,
    client_safeguarding_notes TEXT,
    assessed_at TIMESTAMPTZ NOT NULL,
    clinician_id TEXT NOT NULL,
    domains JSONB NOT NULL,
    summary TEXT NOT NULL,
    domain_scores JSONB NOT NULL,
    review_flag BOOLEAN NOT NULL
)
"""

UPSERT_SQL = """
INSERT INTO assessments (
    assessment_id, client_date_of_birth, client_nhs_number, client_guardian_contact,
    client_safeguarding_notes, assessed_at, clinician_id, domains, summary,
    domain_scores, review_flag
) VALUES (
    %(assessment_id)s, %(client_date_of_birth)s, %(client_nhs_number)s,
    %(client_guardian_contact)s, %(client_safeguarding_notes)s, %(assessed_at)s,
    %(clinician_id)s, %(domains)s, %(summary)s, %(domain_scores)s, %(review_flag)s
)
ON CONFLICT (assessment_id) DO UPDATE SET
    client_date_of_birth = EXCLUDED.client_date_of_birth,
    client_nhs_number = EXCLUDED.client_nhs_number,
    client_guardian_contact = EXCLUDED.client_guardian_contact,
    client_safeguarding_notes = EXCLUDED.client_safeguarding_notes,
    assessed_at = EXCLUDED.assessed_at,
    clinician_id = EXCLUDED.clinician_id,
    domains = EXCLUDED.domains,
    summary = EXCLUDED.summary,
    domain_scores = EXCLUDED.domain_scores,
    review_flag = EXCLUDED.review_flag
"""


def create_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    conn.commit()


def _row_for(assessment: Assessment) -> dict:
    return {
        "assessment_id": assessment.assessment_id,
        "client_date_of_birth": assessment.client.date_of_birth,
        "client_nhs_number": assessment.client.nhs_number,
        "client_guardian_contact": assessment.client.guardian_contact,
        "client_safeguarding_notes": assessment.client.safeguarding_notes,
        "assessed_at": assessment.assessed_at,
        "clinician_id": assessment.clinician_id,
        "domains": json.dumps(
            [
                {"domain": d.domain, "items": [vars(item) for item in d.items]}
                for d in assessment.domains
            ]
        ),
        "summary": assessment.summary,
        "domain_scores": json.dumps(
            {name: asdict(score) for name, score in domain_scores(assessment).items()}
        ),
        "review_flag": review_flag(assessment),
    }


def load_jsonl(conn: psycopg.Connection, path: str) -> int:
    count = 0
    with open(path, encoding="utf-8") as f, conn.cursor() as cur:
        for line in f:
            line = line.strip()
            if not line:
                continue
            assessment = parse_assessment(json.loads(line))
            cur.execute(UPSERT_SQL, _row_for(assessment))
            count += 1
    conn.commit()
    return count


def _like_pattern(text: str) -> str:
    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _queue_conditions(filters: QueueFilters) -> tuple[list[str], dict]:
    conditions = []
    params: dict = {}
    if filters.review_flag is not None:
        conditions.append("review_flag = %(review_flag)s")
        params["review_flag"] = filters.review_flag
    if filters.clinician_id:
        conditions.append("clinician_id = %(clinician_id)s")
        params["clinician_id"] = filters.clinician_id
    # Filter dates are UK calendar days, not UTC ones: 23:30 UTC on 30 April is 1 May in London.
    if filters.assessed_from:
        conditions.append("(assessed_at AT TIME ZONE 'Europe/London')::date >= %(assessed_from)s")
        params["assessed_from"] = filters.assessed_from
    if filters.assessed_to:
        conditions.append("(assessed_at AT TIME ZONE 'Europe/London')::date <= %(assessed_to)s")
        params["assessed_to"] = filters.assessed_to
    if filters.search:
        conditions.append("assessment_id ILIKE %(search)s")
        params["search"] = _like_pattern(filters.search)
    if filters.score_domain:
        conditions.append(
            "(domain_scores -> %(score_domain)s ->> 'percentage')::float"
            " BETWEEN %(score_min)s AND %(score_max)s"
        )
        params["score_domain"] = filters.score_domain
        params["score_min"] = filters.score_min if filters.score_min is not None else 0
        params["score_max"] = filters.score_max if filters.score_max is not None else 100
    return conditions, params


def list_queue(conn: psycopg.Connection, filters: QueueFilters) -> list[QueueItem]:
    conditions, params = _queue_conditions(filters)
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    rows = conn.execute(
        "SELECT assessment_id, clinician_id, assessed_at, review_flag, domain_scores"
        f" FROM assessments {where} ORDER BY review_flag DESC, assessed_at",
        params,
    ).fetchall()
    return [
        QueueItem(
            assessment_id,
            clinician_id,
            assessed_at,
            review_flag,
            {domain: DomainScore(**score) for domain, score in domain_scores.items()},
        )
        for assessment_id, clinician_id, assessed_at, review_flag, domain_scores in rows
    ]
