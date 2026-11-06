import json
from pathlib import Path
from datetime import datetime
from apps.api.database import SessionLocal
from apps.api.models import Dataset

DATA_SAMPLE_DIR = Path(__file__).resolve().parent.parent / "data" / "sample"

def ingest_datasets():
    registry_file = DATA_SAMPLE_DIR / "datasets_registry.json"
    if not registry_file.exists():
        from pipelines.generate_sample_data import generate_datasets_registry
        generate_datasets_registry()

    with open(registry_file, "r", encoding="utf-8") as f:
        datasets = json.load(f)

    db = SessionLocal()
    try:
        for item in datasets:
            existing = db.query(Dataset).filter(Dataset.id == item["id"]).first()
            if not existing:
                ds = Dataset(
                    id=item["id"],
                    name=item["name"],
                    source=item["source"],
                    url=item.get("url"),
                    retrieved_at=datetime.fromisoformat(item["retrieved_at"].replace("Z", "+00:00")),
                    licence=item["licence"],
                    is_demo=item.get("is_demo", True),
                    description=item.get("description")
                )
                db.add(ds)
            else:
                existing.name = item["name"]
                existing.source = item["source"]
                existing.url = item.get("url")
                existing.licence = item["licence"]
                existing.is_demo = item.get("is_demo", True)
                existing.description = item.get("description")
        db.commit()
        print(f"Ingested {len(datasets)} dataset provenance records.")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_datasets()
