import h3
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import City, H3Cell, CellScore, AnalysisRun
from apps.api.schemas.runs import CellFeatureCollection, CellFeature, CellScoreProperties
from apps.api.config import settings
from typing import Optional

router = APIRouter(prefix="/cities", tags=["Hexagonal Cells"])

@router.get("/{city_id}/cells", response_model=CellFeatureCollection)
def get_city_cells(
    city_id: str,
    run_id: Optional[str] = Query(None, description="Optional run ID; defaults to latest completed run"),
    db: Session = Depends(get_db)
):
    # Verify city
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found")

    # If run_id not provided, find the latest completed run
    if not run_id:
        latest_run = (
            db.query(AnalysisRun)
            .filter(AnalysisRun.city_id == city_id, AnalysisRun.status == "COMPLETED")
            .order_by(AnalysisRun.created_at.desc())
            .first()
        )
        if not latest_run:
            raise HTTPException(
                status_code=404,
                detail=f"No completed analysis run found for city '{city_id}'. Please run analysis first."
            )
        target_run_id = latest_run.id
        routing_mode = (latest_run.params or {}).get("routing_provider", settings.ROUTING_PROVIDER)
    else:
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
        target_run_id = run.id
        routing_mode = (run.params or {}).get("routing_provider", settings.ROUTING_PROVIDER)

    # Join H3Cell with CellScore
    records = (
        db.query(H3Cell, CellScore)
        .join(CellScore, CellScore.cell_id == H3Cell.h3_index)
        .filter(CellScore.run_id == target_run_id)
        .all()
    )

    features = []
    for cell, score in records:
        # Get hexagon boundary from h3 v4: list of (lat, lon) -> GeoJSON expects [[lon, lat], ...]
        raw_boundary = h3.cell_to_boundary(cell.h3_index)
        geojson_coords = [[round(pt[1], 6), round(pt[0], 6)] for pt in raw_boundary]
        if geojson_coords and geojson_coords[0] != geojson_coords[-1]:
            geojson_coords.append(geojson_coords[0]) # Close loop for GeoJSON Polygon

        feature = CellFeature(
            type="Feature",
            geometry={
                "type": "Polygon",
                "coordinates": [geojson_coords]
            },
            properties=CellScoreProperties(
                h3_index=cell.h3_index,
                supply_score=score.supply_score,
                demand_score=score.demand_score,
                feasibility_score=score.feasibility_score,
                gap_score=score.gap_score,
                nearest_charger_m=score.nearest_charger_m,
                nearest_charger_min=score.nearest_charger_min,
                chargers_in_reach=score.chargers_in_reach,
                population=cell.population,
                ev_count=cell.ev_count,
                road_density=cell.road_density,
                land_use=cell.land_use,
                dist_substation_m=cell.dist_substation_m,
                accessibility_score=cell.accessibility_score
            )
        )
        features.append(feature)

    return CellFeatureCollection(
        type="FeatureCollection",
        run_id=target_run_id,
        data_mode=settings.DATA_MODE,
        routing_mode=routing_mode,
        features=features
    )
