from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .backend import router as backend_router
from .bookmarks import router as bookmarks_router
from .database import init_db
from .mini_apps import router as mini_apps_router
from .misc import router as misc_router
from .quick import router as quick_router
from .tasks import router as tasks_router

app = FastAPI(title="CareIT FastAPI", version="1.0.0")


def allowed_origins():
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:2000,http://127.0.0.1:2000")
    return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Patient-Id", "X-FHIR-Base"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(misc_router)
app.include_router(backend_router)
app.include_router(tasks_router)
app.include_router(mini_apps_router)
app.include_router(bookmarks_router)
app.include_router(quick_router)
