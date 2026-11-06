import csv
from pathlib import Path
from apps.api.database import SessionLocal
from apps.api.models import Charger
from apps.api.config import settings

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def ingest_chargers(city_id: str = "vizag", file_path: str = None):
    if not file_path:
        # Determine whether to use raw or sample based on existence & DATA_MODE
        raw_file = DATA_DIR / "raw" / "chargers.csv"
        sample_file = DATA_DIR / "sample" / f"chargers_{city_id}.csv"
        if raw_file.exists() and settings.DATA_MODE == "real":
            target = raw_file
        else:
            target = sample_file
    else:
        target = Path(file_path)

    if not target.exists():
        raise FileNotFoundError(f"Chargers data file not found: {target}")

    db = SessionLocal()
    try:
        count = 0
        with open(target, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                charger_id = row.get("id") or f"chg_{city_id}_{count}"
                existing = db.query(Charger).filter(Charger.id == charger_id).first()
                connector_types = [c.strip() for c in row.get("connector_types", "").split(",") if c.strip()]

                if not existing:
                    charger = Charger(
                        id=charger_id,
                        city_id=city_id,
                        name=row.get("name", "Public EV Charger"),
                        operator=row.get("operator", "Unknown"),
                        lat=float(row["lat"]),
                        lon=float(row["lon"]),
                        connector_types=connector_types,
                        power_kw=float(row.get("power_kw", 30.0)),
                        charger_type=row.get("charger_type", "DC_FAST"),
                        status=row.get("status", "OPERATIONAL"),
                        source=row.get("source", "BEE_REGISTRY" if settings.DATA_MODE == "real" else "SAMPLE_DEMO")
                    )
                    db.add(charger)
                else:
                    existing.name = row.get("name", existing.name)
                    existing.operator = row.get("operator", existing.operator)
                    existing.lat = float(row["lat"])
                    existing.lon = float(row["lon"])
                    existing.connector_types = connector_types
                    existing.power_kw = float(row.get("power_kw", existing.power_kw))
                    existing.charger_type = row.get("charger_type", existing.charger_type)
                    existing.status = row.get("status", existing.status)
                count += 1
        db.commit()
        print(f"Ingested {count} chargers for {city_id} from {target.name}")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="vizag")
    parser.add_argument("--file", default=None)
    args = parser.parse_args()
    ingest_chargers(args.city, args.file)
