from flask import Blueprint, request, jsonify, url_for

from models import db, Task, TaskStatus, Bookmark
from utils.auth import require_bearer, require_bearer_or_basic

bookmarks = Blueprint('bookmarks', __name__)


@bookmarks.route('/api/bookmarks', methods=['GET'])
@require_bearer_or_basic
def get_bookmarks():
    items = (
        Bookmark.query
        .join(Task)
        .filter(Task.status == TaskStatus.completed, Task.html_content.isnot(None))
        .order_by(Bookmark.created_at.desc())
        .all()
    )

    return jsonify({"bookmarks": [{
        "task_id":     b.task_id,
        "url":         url_for('mini_apps.mini_app_preview', task_id=b.task_id, _external=True),
        "title":       b.task.title,
        "description": b.task.description,
        "added_by":    b.added_by,
    } for b in items]})


@bookmarks.route('/api/bookmarks/v1', methods=['POST'])
@require_bearer
def add_bookmark():
    data    = request.get_json(silent=True) or {}
    task_id = data.get('task_id')

    if not task_id:
        return jsonify({"error": "task_id is required"}), 400

    task = Task.query.get_or_404(task_id)

    if task.status != TaskStatus.completed or not task.html_content:
        return jsonify({"error": "Only completed mini apps can be bookmarked"}), 400

    bookmark = Bookmark(task_id=task_id, added_by=data.get('added_by'))
    db.session.add(bookmark)
    db.session.commit()

    return jsonify({
        "task_id":     bookmark.task_id,
        "title":       task.title,
        "description": task.description,
        "added_by":    bookmark.added_by,
    }), 201


@bookmarks.route('/api/bookmarks/<task_id>', methods=['DELETE'])
@require_bearer
def remove_bookmark(task_id):
    bookmark = Bookmark.query.filter_by(task_id=task_id).first_or_404()
    db.session.delete(bookmark)
    db.session.commit()
    return jsonify({"message": "Bookmark removed"}), 200
