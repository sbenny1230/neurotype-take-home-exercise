from collections.abc import Iterator

import psycopg
from fastapi import APIRouter, Depends

from src.assessments.model import QueueItem
from src.assessments.store import list_queue
from src.clients.db import get_connection

router = APIRouter(tags=["assessments"])


def get_db() -> Iterator[psycopg.Connection]:
    with get_connection() as conn:
        yield conn


@router.get("/assessments")
def list_assessments(conn: psycopg.Connection = Depends(get_db)) -> list[QueueItem]:
    return list_queue(conn)
