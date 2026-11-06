"""
Master Analysis Pipeline Orchestrator.
CLI Usage:
python -m pipelines.run --city vizag --travel-minutes 10 --h3-res 8
"""

import argparse
from datetime import datetime, timezone
from apps.api.database import SessionLocal
from apps.api.models import AnalysisRun, CellScore, Charger, H3Cell, City
from apps.api.config import settings
from pipelines.h3_grid import generate_h3_grid
from pipelines.routing import get_routing_provider
from pipelines.supply import compute_cell_supply_scores
from pipelines.demand import DemandModel
from pipelines.feasibility import compute_cell_feasibility_scores
from pipelines.gap import compute_gap_scores

def run_pipeline(
    city_id: str = "vizag",
    travel_minutes: int = 10,
    h3_res: int = 8,
    run_id: str = None
) -> str:
    now_utc = datetime.now(timezone.utc)
    if run_id is None:
        run_id = f"run_{city_id}_{now_utc.strftime('%Y%m%d_%H%M%S')}"

    print(f"\n==================================================")
    print(f"[PIPELINE] Launching EV Gap Analysis Pipeline")
    print(f"City: {city_id} | Travel catchment: {travel_minutes} min | H3 Res: {h3_res}")
    print(f"Run ID: {run_id}")
    print(f"Data Mode: {settings.DATA_MODE} | Routing: {settings.ROUTING_PROVIDER}")
    print(f"==================================================")

    db = SessionLocal()
    try:
        # 1. Ensure city exists in DB
        city = db.query(City).filter(City.id == city_id).first()
        if not city:
            from pipelines.seed_city import seed_city
            seed_city(city_id)

        # 2. Generate or fetch H3 grid
        print("\n[Step 1/6] Discretizing spatial grid...")
        cells_data = generate_h3_grid(city_id, res=h3_res)
        print(f"-> Grid ready: {len(cells_data)} H3 hexagons")

        # 3. Fetch existing chargers
        chargers = db.query(Charger).filter(Charger.city_id == city_id).all()
        chargers_data = [
            {
                "id": c.id,
                "name": c.name,
                "lat": c.lat,
                "lon": c.lon,
                "power_kw": c.power_kw,
                "charger_type": c.charger_type
            }
            for c in chargers
        ]
        print(f"-> Loaded {len(chargers_data)} existing chargers")

        # 4. Compute Supply Scores
        print("\n[Step 2/6] Computing road travel catchment & supply scores...")
        provider = get_routing_provider()
        supply_results = compute_cell_supply_scores(
            cells=cells_data,
            chargers=chargers_data,
            travel_minutes=travel_minutes,
            routing_provider=provider
        )
        supply_scores = [s["supply_score"] for s in supply_results]
        print(f"-> Supply scored (Routing: {provider.name}, approx={provider.is_approximate})")

        # 5. Compute Demand Scores
        print("\n[Step 3/6] Fitting gradient boosting regressor for demand...")
        demand_engine = DemandModel()
        demand_scores, model_metrics = demand_engine.train_and_predict(cells_data)
        print(f"-> Demand trained: R2={model_metrics['r2_score']}, MAE={model_metrics['mae']}")

        # 6. Compute Feasibility Scores
        print("\n[Step 4/6] Computing grid & land-use feasibility scores...")
        feasibility_scores = compute_cell_feasibility_scores(cells_data)
        print("-> Feasibility scored")

        # 7. Compute Gap Scores
        print("\n[Step 5/6] Calculating decay-weighted Gap Scores...")
        gap_scores = compute_gap_scores(demand_scores, supply_scores)
        print(f"-> Gap scores computed: Min={min(gap_scores)}, Max={max(gap_scores)}, Mean={round(sum(gap_scores)/len(gap_scores), 2)}")

        # 8. Record Analysis Run and Cell Scores into DB
        print("\n[Step 6/6] Persisting run and cell scores...")
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
        if not run:
            run = AnalysisRun(
                id=run_id,
                city_id=city_id,
                created_at=now_utc,
                travel_minutes=travel_minutes,
                h3_res=h3_res,
                params={
                    "routing_provider": provider.name,
                    "is_approximate": provider.is_approximate,
                    "model_metrics": model_metrics,
                    "data_mode": settings.DATA_MODE
                },
                status="COMPLETED"
            )
            db.add(run)
        else:
            run.status = "COMPLETED"
            run.travel_minutes = travel_minutes
            run.h3_res = h3_res
            run.params = {
                "routing_provider": provider.name,
                "is_approximate": provider.is_approximate,
                "model_metrics": model_metrics,
                "data_mode": settings.DATA_MODE
            }

        # Clear existing scores for this run if rerun
        db.query(CellScore).filter(CellScore.run_id == run_id).delete()

        score_records = []
        for i, c in enumerate(cells_data):
            cell_id = c["h3_index"]
            supp_meta = supply_results[i]
            score_rec = CellScore(
                id=f"{run_id}_{cell_id}",
                cell_id=cell_id,
                run_id=run_id,
                supply_score=supply_scores[i],
                demand_score=demand_scores[i],
                feasibility_score=feasibility_scores[i],
                gap_score=gap_scores[i],
                nearest_charger_m=supp_meta["nearest_charger_m"],
                nearest_charger_min=supp_meta["nearest_charger_min"],
                chargers_in_reach=supp_meta["chargers_in_reach"]
            )
            score_records.append(score_rec)

        db.bulk_save_objects(score_records)
        db.commit()

        print(f"-> Saved {len(score_records)} scored hexagons for Run {run_id}.")
        print("[PIPELINE] Completed Successfully!\n")
        return run_id
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="vizag")
    parser.add_argument("--travel-minutes", type=int, default=10)
    parser.add_argument("--h3-res", type=int, default=8)
    parser.add_argument("--run-id", default=None)
    args = parser.parse_args()

    run_pipeline(
        city_id=args.city,
        travel_minutes=args.travel_minutes,
        h3_res=args.h3_res,
        run_id=args.run_id
    )
