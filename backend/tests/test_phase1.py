import pytest
from backend.app.db.database import SessionLocal
from backend.app.models.schema import City, Dataset, Charger
from backend.app.api.v1.endpoints.datasets import get_datasets
from backend.app.api.v1.endpoints.cities import get_cities, get_city_chargers

def test_database_models_and_queries():
    db = SessionLocal()
    try:
        # Test cities
        cities = get_cities(db)
        assert len(cities) >= 1
        vizag = next((c for c in cities if c.id == "vizag"), None)
        assert vizag is not None
        assert vizag.name == "Visakhapatnam"
        assert vizag.lat_center > 17.0 and vizag.lon_center > 80.0

        # Test datasets provenance
        datasets = get_datasets(db)
        assert len(datasets) >= 5
        assert all(d.licence for d in datasets)
        assert all(d.source for d in datasets)

        # Test chargers GeoJSON
        chargers_fc = get_city_chargers("vizag", None, None, None, db)
        assert chargers_fc.type == "FeatureCollection"
        assert len(chargers_fc.features) >= 10
        first_feat = chargers_fc.features[0]
        assert first_feat.geometry.type == "Point"
        assert len(first_feat.geometry.coordinates) == 2
        assert first_feat.properties.power_kw > 0
    finally:
        db.close()
