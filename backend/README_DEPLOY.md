# AgriConnect AI Backend Deployment Guide

## 1. Environment Variables
- Copy `.env` and set all secrets (do not commit real keys to Git!)
- (Optional) Use `.env.example` for safe sharing
- Set `JWT_SECRET_KEY` to a random secret of at least 32 characters. The API will not issue or verify auth tokens without it.
- Optionally set `AUTH_DATABASE_PATH` to the persistent location for the SQLite user database. By default, it is `backend/data/auth.sqlite3`.

## 2. Install Dependencies
```bash
pip install -r requirements.txt
```

## 3. Run Locally (Dev)
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 4. Production Deployment
- Use the provided Dockerfile, or run Uvicorn with:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- For cloud: set environment variables, mount persistent storage if needed
- Ensure CORS origins in `main.py` include your frontend domain!

## 5. Health Check
- The `/health` endpoint returns `{ "status": "ok" }` for deployment monitoring.

---

For advanced deployment (Gunicorn, systemd, etc.), see FastAPI docs.
