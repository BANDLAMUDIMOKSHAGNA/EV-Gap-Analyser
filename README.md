# EV Gap Analyser 🚗⚡

> **A decision-support platform for city planners, municipal bodies, EV charging operators, and infrastructure developers.**  
> Answers **WHERE** EV charging stations are missing and **WHERE** new ones should be built within a specified budget.

Pilot City: **Visakhapatnam (Vizag), Andhra Pradesh, India** (city-agnostic architecture).

---

## 🌟 Key Highlights
- **Explainable Multi-Criteria Site Ranking**: AHP (Analytic Hierarchy Process) + TOPSIS with transparent per-criterion score contributions ("Why this site?").
- **Budget-Constrained Optimisation**: Google OR-Tools (CP-SAT) maximal-coverage solver generating optimal site combinations and Pareto budget-vs-coverage curves.
- **H3 Hexagonal Spatial Modeling**: Continuous urban catchment modeling using Uber H3 discrete global grid (Resolution 8 default, configurable 7–9).
- **Data Honesty & Traceability**: Strict provenance tracking (`GET /api/v1/datasets`). Explicit "Demo data" indicators when running in synthetic/sample mode (`DATA_MODE=demo`).
- **Flexible Dual Storage & Routing**: Seamlessly runs on PostgreSQL 16 + PostGIS or standalone SQLite spatial fallback; routes via OSRM Docker or calibrated urban detour haversine approximation.

---

## 🏗️ Repository Layout
```
/apps
  /web          # Next.js App Router, Tailwind CSS, MapLibre GL, Recharts, TanStack Query
  /api          # FastAPI backend (routers, services, models, schemas, tests)
/pipelines      # Data ingestion & analytics engine (CLI: python -m pipelines.run --city vizag)
/data
  /raw          # Ingested OpenStreetMap, BEE registry, Vahan RTO files
  /processed    # Generated H3 cells, spatial feature matrices, cached runs
  /sample       # Bundled demo datasets with documented provenance
/infra          # docker-compose.yml, OSRM setup
/docs           # ARCHITECTURE.md, METHODOLOGY.md, DATA_SOURCES.md, API.md
/config         # City bounding definitions and financial parameters
```

---

## 🚀 Quickstart

### 1. Requirements
- Python 3.11+
- Node.js 18+ (npm 10+)
- Docker & Docker Compose (optional for full containerised stack)

### 2. Setup & Execution
```bash
# 1. Install dependencies
make setup

# 2. Ingest datasets
make seed

# 3. Execute gap analysis pipeline
make run-demo

# 4. Start backend (http://localhost:8000)
make dev-api

# 5. Start frontend (http://localhost:3000)
make dev-web
```
