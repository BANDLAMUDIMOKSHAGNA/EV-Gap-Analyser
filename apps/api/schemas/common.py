from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    state: str
    country: str
    default_h3_res: int
    lat_center: float
    lon_center: float
    boundary_geojson: Dict[str, Any]

class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    source: str
    url: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    licence: str
    is_demo: bool
    description: Optional[str] = None

class ChargerProperties(BaseModel):
    id: str
    name: str
    operator: Optional[str] = None
    connector_types: List[str]
    power_kw: float
    charger_type: str
    status: str
    source: Optional[str] = None
    updated_at: Optional[datetime] = None

class GeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: List[float] # [lon, lat]

class ChargerFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: ChargerProperties

class ChargerFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    data_mode: str
    features: List[ChargerFeature]
