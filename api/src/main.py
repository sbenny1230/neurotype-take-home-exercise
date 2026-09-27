from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.assessments.routes import router as assessments_router
from src.assessments.store import create_schema, load_jsonl
from src.clinicians.routes import router as clinicians_router
from src.config import get_settings
from src.health.routes import router as health_router
from src.clients.db import get_connection

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    with get_connection() as conn:
        create_schema(conn)
        count = load_jsonl(conn, settings.data_file)
    print(f"[api] loaded {count} assessments from {settings.data_file}", flush=True)
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.web_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router)
app.include_router(assessments_router)
app.include_router(clinicians_router)
