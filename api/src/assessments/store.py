"""domain_scores/review_flag are a cache of service.py's output, computed at
load time so the queue can filter/sort on them in SQL instead of rescoring
every row in Python on every request. Re-running load_jsonl recomputes and
upserts them, so a scoring-logic change is picked up by reloading."""

from __future__ import annotations

import json
from datetime import date, datetime

import psycopg

from src.assessments.model import Assessment, Client, Domain, Item, QueueItem
from src.assessments.service import band_for_percentage, domain_percentage, review_flag

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


def _parse_assessment(data: dict) -> Assessment:
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


def create_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(CREATE_TABLE_SQL)
    conn.commit()


def _domain_scores(assessment: Assessment) -> dict[str, dict[str, float | str | None]]:
    scores = {}
    for domain in assessment.domains:
        pct = domain_percentage(domain)
        scores[domain.domain] = {
            "percentage": pct,
            "band": band_for_percentage(pct).value if pct is not None else None,
        }
    return scores


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
        "domain_scores": json.dumps(_domain_scores(assessment)),
        "review_flag": review_flag(assessment),
    }


def load_jsonl(conn: psycopg.Connection, path: str) -> int:
    count = 0
    with open(path, encoding="utf-8") as f, conn.cursor() as cur:
        for line in f:
            line = line.strip()
            if not line:
                continue
            assessment = _parse_assessment(json.loads(line))
            cur.execute(UPSERT_SQL, _row_for(assessment))
            count += 1
    conn.commit()
    return count


def list_queue(conn: psycopg.Connection) -> list[QueueItem]:
    rows = conn.execute(
        "SELECT assessment_id, clinician_id, assessed_at, review_flag"
        " FROM assessments ORDER BY assessed_at"
    ).fetchall()
    return [QueueItem(*row) for row in rows]
