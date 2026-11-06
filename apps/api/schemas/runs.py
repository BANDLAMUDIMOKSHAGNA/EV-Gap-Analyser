from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class RunCreate(BaseModel):
    city_id: str = "vizag"
    travel_minutes: int = Field(default=10, ge=5, le=30)
    h3_res: int = Field(default=8, ge=7, le=9)

class RunStatusOut(BaseModel):
    id: str
    city_id: str
    created_at: datetime
    travel_minutes: int
    h3_res: int
    status: str
    params: Dict[str, Any]
    scored_cells_count: int

class CellScoreProperties(BaseModel):
    h3_index: str
    supply_score: float
    demand_score: float
    feasibility_score: float
    gap_score: float
    nearest_charger_m: float
    nearest_charger_min: float
    chargers_in_reach: int
    population: float
    ev_count: float
    road_density: float
    land_use: str
    dist_substation_m: float
    accessibility_score: float

class CellFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any] # Polygon coordinates
    properties: CellScoreProperties

class CellFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    run_id: str
    data_mode: str
    routing_mode: str
    features: List[CellFeature]
