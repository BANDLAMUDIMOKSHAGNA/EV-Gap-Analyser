import json
from pathlib import Path
from apps.api.database import SessionLocal
from apps.api.models import City

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config" / "cities"

def seed_city(city_id: str = "vizag"):
    config_file = CONFIG_DIR / f"{city_id}.json"
    if not config_file.exists():
        raise FileNotFoundError(f"City configuration not found: {config_file}")

    with open(config_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    db = SessionLocal()
    try:
        city = db.query(City).filter(City.id == data["id"]).first()
        if not city:
            city = City(
                id=data["id"],
                name=data["name"],
                state=data["state"],
                country=data.get("country", "India"),
                boundary_geojson={
                    "type": "Polygon",
                    "coordinates": [data["boundary_polygon"]]
                },
                default_h3_res=data.get("default_h3_res", 8),
                lat_center=data["lat_center"],
                lon_center=data["lon_center"]
            )
            db.add(city)
            db.commit()
            print(f"Seeded city: {data['name']} ({data['id']})")
        else:
            print(f"City {data['name']} already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="vizag")
    args = parser.parse_args()
    seed_city(args.city)
