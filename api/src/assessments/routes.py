from typing import Annotated

import psycopg
from fastapi import APIRouter, Depends, Query

from src.assessments.model import QueueFilters, QueueItem
from src.assessments.store import list_queue
from src.clients.db import get_db

router = APIRouter(tags=["assessments"])


@router.get("/assessments")
def list_assessments(
    filters: Annotated[QueueFilters, Query()],
    conn: psycopg.Connection = Depends(get_db),
) -> list[QueueItem]:
    return list_queue(conn, filters)
