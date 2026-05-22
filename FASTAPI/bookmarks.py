from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import require_bearer, require_bearer_or_basic
from .database import get_db
from .models import Bookmark, Task, TaskStatus
from .schemas import BookmarkCreate
from .utils import absolute_url, task_or_404

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


@router.get("", dependencies=[Depends(require_bearer_or_basic)])
def get_bookmarks(request: Request, db: Session = Depends(get_db)):
    query = select(Bookmark).join(Task).where(Task.status == TaskStatus.completed, Task.html_content.is_not(None)).order_by(Bookmark.created_at.desc())
    return {"bookmarks": [bookmark_item(request, item) for item in db.scalars(query).all()]}


def bookmark_item(request: Request, item: Bookmark):
    return {
        "task_id": item.task_id, "url": absolute_url(request, f"/mini-apps/{item.task_id}"),
        "title": item.task.title, "description": item.task.description,
        "added_by": item.added_by,
    }


@router.post("/v1", dependencies=[Depends(require_bearer)], status_code=201)
def add_bookmark(payload: BookmarkCreate, db: Session = Depends(get_db)):
    task = task_or_404(db, payload.task_id)
    if task.status != TaskStatus.completed or not task.html_content:
        raise HTTPException(status_code=400, detail="Only completed mini apps can be bookmarked")
    bookmark = Bookmark(task_id=payload.task_id, added_by=payload.added_by)
    db.add(bookmark)
    db.commit()
    return {"task_id": bookmark.task_id, "title": task.title, "description": task.description, "added_by": bookmark.added_by}


@router.delete("/{task_id}", dependencies=[Depends(require_bearer)])
def remove_bookmark(task_id: str, db: Session = Depends(get_db)):
    bookmark = db.scalar(select(Bookmark).where(Bookmark.task_id == task_id))
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark removed"}
