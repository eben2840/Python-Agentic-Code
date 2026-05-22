from __future__ import annotations

from typing import Optional
from typing import Any

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(default="SMART on FHIR Mini App", max_length=500)
    description: str = ""
    specification: str = ""
    complexity: str = "standard"


class BackendCreate(BaseModel):
    prompt: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    specification: str = ""
    complexity: str = "standard"


class IdeaRequest(BaseModel):
    prompt: str


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    specification: Optional[str] = None
    status: Optional[str] = None


class ContinueTask(BaseModel):
    changes: str


class BookmarkCreate(BaseModel):
    task_id: str
    added_by: Optional[str] = None


class TransferPayload(BaseModel):
    status: Optional[str] = None
    roles: list[str] = []
    show_at: list[str] = []
    department: Optional[str] = None
    ward: Optional[str] = None


class ExtractRequest(BaseModel):
    transcript: str


class QuickGenerateRequest(BaseModel):
    prompt: str
    accessToken: str
    fhirBaseUrl: str
    patientId: str


class JsonResponse(BaseModel):
    data: dict[str, Any]
