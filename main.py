"""
Root entrypoint for Vercel multi-service deployment and ASGI runners.
Exposes the FastAPI application defined in apps/api/main.py.
"""
from apps.api.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
