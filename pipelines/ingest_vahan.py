import csv
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def load_vahan_ev_stats(city_id: str = "vizag", file_path: str = None) -> list[dict]:
    if not file_path:
        sample_file = DATA_DIR / "sample" / f"vahan_{city_id}.csv"
        raw_file = DATA_DIR / "raw" / f"vahan_{city_id}.csv"
        target = raw_file if raw_file.exists() else sample_file
    else:
        target = Path(file_path)

    if not target.exists():
        raise FileNotFoundError(f"Vahan dataset not found: {target}")

    records = []
    with open(target, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            records.append({
                "rto_code": r["rto_code"],
                "rto_office": r["rto_office"],
                "year": int(r["year"]),
                "ev_2w": int(r.get("ev_2w", 0)),
                "ev_3w": int(r.get("ev_3w", 0)),
                "ev_4w": int(r.get("ev_4w", 0)),
                "ev_total": int(r.get("ev_total", 0)),
            })
    print(f"Loaded {len(records)} Vahan registration records from {target.name}")
    return records

if __name__ == "__main__":
    records = load_vahan_ev_stats()
    print("Sample records:", records[:2])
