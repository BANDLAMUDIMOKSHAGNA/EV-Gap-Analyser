# Deployment Guide

## 1. Vercel Multi-Services
The project uses Vercel Services to deploy both frontend and backend under a single domain.
- Frontend root: `frontend/` (Next.js)
- Backend root: `.` (FastAPI ASGI entrypoint via `main.py`)
- Binding: `web` calls `app` via `process.env.API_URL`

## 2. Docker Compose
Run locally with Docker:
```bash
docker compose up -d
```
