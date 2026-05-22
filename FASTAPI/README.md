# FastAPI Port

This folder is isolated from the Flask app. It reads the same `.env`, database, prompts, and generated app folder from the repo root.

Run from the repo root:

```bash
pip install -r FASTAPI/requirements.txt
uvicorn FASTAPI.main:app --reload --port 8000
```

Main routes included:

- `GET /api/health`
- `GET /api/tasks`
- `GET /api/tasks/{task_id}`
- `POST /api/tasks/{task_id}/run`
- `POST /api/tasks/{task_id}/continue`
- `GET /api/quick/status/{task_id}`
- `POST /api/quick/extract`
- `POST /api/quick/generate`
- `GET /api/mini-apps?patient_id=...`
- `GET /mini-apps/{task_id}`
- `GET /api/bookmarks`
- `GET /careit-web/api/v1`

Keep running the Flask app until you have tested these route contracts against your Flutter/webview client.
