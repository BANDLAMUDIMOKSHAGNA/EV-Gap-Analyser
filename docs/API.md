# REST API Reference — EV Gap Analyser v1

Interactive OpenAPI / Swagger documentation is available at `/docs` (or `/redoc`).
Base endpoint prefix: `/api/v1`

---

## 1. Endpoints Overview

| Method | Endpoint | Description | Query / Body Params | Response |
|---|---|---|---|---|
| `GET` | `/cities` | List all configured cities | None | `List[CityOut]` |
| `GET` | `/cities/{id}` | City details with boundary GeoJSON | `city_id` | `CityOut` |
| `GET` | `/cities/{id}/chargers` | Public charging stations GeoJSON | `charger_type`, `operator`, `status` | `ChargerFeatureCollection` |
| `GET` | `/cities/{id}/cells` | H3 hexagonal grid with scores | `run_id` (defaults to latest) | `CellFeatureCollection` |
| `GET` | `/datasets` | Transparency & data provenance registry | None | `List[DatasetOut]` |
| `POST` | `/runs` | Launch new gap analysis pipeline | `{"city_id", "travel_minutes", "h3_res"}` | `RunStatusOut` |
| `GET` | `/runs` | List recent analysis runs | `city_id` | `List[RunStatusOut]` |
| `GET` | `/runs/{id}` | Status and progress of an analysis run | None | `RunStatusOut` |
| `GET` | `/runs/{id}/hotspots` | Clustered high-gap candidate sites | None | `CandidateSites` |
| `POST` | `/runs/{id}/rank` | Multi-criteria AHP & TOPSIS ranking | `{"weights"}` or `{"ahp_matrix"}` | `RankingResponse` |
| `POST` | `/runs/{id}/optimise` | OR-Tools CP-SAT budget maximal coverage | `{"budget_inr", "n_sites", "charger_type"}` | `OptimiseResponse` |
| `POST` | `/scenarios` | Save scenario portfolio | Scenario payload | `ScenarioOut` |
| `GET` | `/scenarios` | List saved scenarios | None | `List[ScenarioOut]` |
| `GET` | `/scenarios/{id}` | Get saved scenario details | None | `ScenarioOut` |
| `GET` | `/sites/{id}/report` | Candidate site feasibility JSON | None | JSON report |
| `GET` | `/sites/{id}/report.pdf` | Downloadable executive PDF feasibility report | None | `application/pdf` stream |
| `GET` | `/export/{run_id}` | Export run data in CSV or GeoJSON | `format=csv\|geojson` | File attachment stream |
| `POST` | `/auth/login` | Simple role-based JWT authentication | `{"email", "password", "role"}` | `TokenResponse` |
| `GET` | `/auth/me` | Current authenticated user profile | Bearer token | Profile JSON |
