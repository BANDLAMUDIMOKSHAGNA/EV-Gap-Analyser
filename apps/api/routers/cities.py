from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import City, Charger
from apps.api.schemas.common import CityOut, ChargerFeatureCollection, ChargerFeature, GeoJSONGeometry, ChargerProperties
from apps.api.config import settings
from typing import List, Optional

router = APIRouter(prefix="/cities", tags=["Cities & Infrastructure"])

@router.get("", response_model=List[CityOut])
def get_cities(db: Session = Depends(get_db)):
    cities = db.query(City).all()
    return cities

@router.get("/{city_id}", response_model=CityOut)
def get_city(city_id: str, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found")
    return city

@router.get("/{city_id}/chargers", response_model=ChargerFeatureCollection)
def get_city_chargers(
    city_id: str,
    charger_type: Optional[str] = Query(None, description="Filter by DC_FAST, AC_SLOW, etc."),
    operator: Optional[str] = Query(None, description="Filter by operator name"),
    status: Optional[str] = Query(None, description="Filter by operational status"),
    db: Session = Depends(get_db)
):
    query = db.query(Charger).filter(Charger.city_id == city_id)
    if charger_type:
        query = query.filter(Charger.charger_type == charger_type)
    if operator:
        query = query.filter(Charger.operator.ilike(f"%{operator}%"))
    if status:
        query = query.filter(Charger.status == status)

    chargers = query.all()

    features = []
    for c in chargers:
        feat = ChargerFeature(
            type="Feature",
            geometry=GeoJSONGeometry(
                type="Point",
                coordinates=[c.lon, c.lat]
            ),
            properties=ChargerProperties(
                id=c.id,
                name=c.name,
                operator=c.operator,
                connector_types=c.connector_types or [],
                power_kw=c.power_kw,
                charger_type=c.charger_type,
                status=c.status,
                source=c.source,
                updated_at=c.updated_at
            )
        )
        features.append(feat)

    return ChargerFeatureCollection(
        type="FeatureCollection",
        data_mode=settings.DATA_MODE,
        features=features
    )
