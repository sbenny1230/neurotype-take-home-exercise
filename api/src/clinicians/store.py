from __future__ import annotations

import psycopg


def list_clinician_ids(conn: psycopg.Connection) -> list[str]:
    rows = conn.execute(
        "SELECT DISTINCT clinician_id FROM assessments ORDER BY clinician_id"
    ).fetchall()
    return [clinician_id for (clinician_id,) in rows]
