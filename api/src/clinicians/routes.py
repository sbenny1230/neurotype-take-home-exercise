import psycopg
from fastapi import APIRouter, Depends

from src.clients.db import get_db
from src.clinicians.store import list_clinician_ids

router = APIRouter(tags=["clinicians"])


@router.get("/clinicians")
def list_clinicians(conn: psycopg.Connection = Depends(get_db)) -> list[str]:
    return list_clinician_ids(conn)
