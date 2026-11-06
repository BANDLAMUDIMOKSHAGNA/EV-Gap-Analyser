from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apps.api.config import settings
from apps.api.routers import cities, datasets, runs, cells, ranking, scenarios, reports, auth

app = FastAPI(
    title="EV Gap Analyser API",
    description="Decision-support platform for municipal bodies, urban planners, and EV charging operators.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(cities.router, prefix="/api/v1")
app.include_router(cells.router, prefix="/api/v1")
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(runs.router, prefix="/api/v1")
app.include_router(ranking.router, prefix="/api/v1")
app.include_router(scenarios.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "app": "EV Gap Analyser",
        "version": "1.0.0",
        "data_mode": settings.DATA_MODE,
        "routing_provider": settings.ROUTING_PROVIDER,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "data_mode": settings.DATA_MODE,
        "routing_provider": settings.ROUTING_PROVIDER
    }
