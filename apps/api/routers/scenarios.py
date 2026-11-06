import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from apps.api.database import get_db
from apps.api.models import AnalysisRun, H3Cell, CellScore, CandidateSite, Scenario
from apps.api.schemas.scenarios import OptimiseRequest, OptimiseResponse, ScenarioSave, ScenarioOut
from pipelines.optimizer import solve_maximal_coverage_budget
from pipelines.ranking import derive_ahp_weights, rank_candidates_topsis
from pipelines.clustering import cluster_high_gap_cells
from typing import List

router = APIRouter(tags=["Budget Optimisation & Scenarios"])

@router.post("/runs/{run_id}/optimise", response_model=OptimiseResponse)
def optimise_run(run_id: str, req: OptimiseRequest, db: Session = Depends(get_db)):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    # Fetch candidates or compute if not yet ranked
    candidate_records = db.query(CandidateSite).filter(CandidateSite.run_id == run_id).all()
    candidates = []
    if candidate_records:
        for c in candidate_records:
            candidates.append({
                "id": c.id,
                "cluster_id": c.cluster_id,
                "lat": c.lat,
                "lon": c.lon,
                "name": c.name,
                "zone": c.zone,
                "topsis_score": c.topsis_score,
                "est_daily_sessions": c.est_daily_sessions,
                "est_cost_inr": c.est_cost_inr,
                "payback_years": c.payback_years,
                "criteria_breakdown": c.criteria_breakdown
            })
    else:
        # Fallback: compute candidates from cells
        cells = db.query(H3Cell).filter(H3Cell.city_id == run.city_id).all()
        scores = db.query(CellScore).filter(CellScore.run_id == run_id).all()
        cells_data = [{"h3_index": c.h3_index, "lat": c.lat, "lon": c.lon, "population": c.population, "land_use": c.land_use, "dist_substation_m": c.dist_substation_m, "accessibility_score": c.accessibility_score} for c in cells]
        scores_data = [{"cell_id": s.cell_id, "gap_score": s.gap_score, "demand_score": s.demand_score, "supply_score": s.supply_score, "nearest_charger_m": s.nearest_charger_m} for s in scores]
        raw_cands = cluster_high_gap_cells(cells_data, scores_data)
        weights, _, _ = derive_ahp_weights()
        candidates = rank_candidates_topsis(raw_cands, weights)

    # Fetch cells
    cells = db.query(H3Cell).filter(H3Cell.city_id == run.city_id).all()
    scores = db.query(CellScore).filter(CellScore.run_id == run_id).all()
    score_map = {s.cell_id: s for s in scores}

    cell_items = []
    existing_covered_indices = set()
    for idx, c in enumerate(cells):
        sc = score_map.get(c.h3_index)
        demand_val = sc.demand_score if sc else 10.0
        chargers_in_reach = sc.chargers_in_reach if sc else 0
        if chargers_in_reach > 0:
            existing_covered_indices.add(idx)

        cell_items.append({
            "h3_index": c.h3_index,
            "lat": c.lat,
            "lon": c.lon,
            "demand_score": demand_val
        })

    # Solve CP-SAT
    result = solve_maximal_coverage_budget(
        candidates=candidates,
        cells=cell_items,
        existing_coverage_indices=existing_covered_indices,
        budget_inr=req.budget_inr,
        max_sites=req.n_sites,
        charger_type=req.charger_type,
        travel_minutes=run.travel_minutes
    )

    return OptimiseResponse(
        run_id=run_id,
        budget_inr=req.budget_inr,
        n_sites=req.n_sites,
        charger_type=req.charger_type,
        selected_site_ids=result["selected_site_ids"],
        selected_sites=result["selected_sites"],
        coverage_before=result["coverage_before"],
        coverage_after=result["coverage_after"],
        total_cost_inr=result["total_cost_inr"],
        avg_payback_years=result["avg_payback_years"],
        solver_status=result["solver_status"],
        curve=result["curve"]
    )

@router.post("/scenarios", response_model=ScenarioOut)
def save_scenario(req: ScenarioSave, db: Session = Depends(get_db)):
    scenario_id = f"scen_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}"
    scen = Scenario(
        id=scenario_id,
        run_id=req.run_id,
        name=req.name,
        budget_inr=req.budget_inr,
        n_sites=req.n_sites,
        charger_type=req.charger_type,
        selected_site_ids=req.selected_site_ids,
        coverage_before=req.coverage_before,
        coverage_after=req.coverage_after,
        total_cost_inr=req.total_cost_inr,
        avg_payback_years=req.avg_payback_years,
        curve=req.curve or [],
        created_at=datetime.now(timezone.utc)
    )
    db.add(scen)
    db.commit()

    return ScenarioOut(
        id=scen.id,
        run_id=scen.run_id,
        name=scen.name,
        budget_inr=scen.budget_inr,
        n_sites=scen.n_sites,
        charger_type=scen.charger_type,
        selected_site_ids=scen.selected_site_ids,
        coverage_before=scen.coverage_before,
        coverage_after=scen.coverage_after,
        total_cost_inr=scen.total_cost_inr,
        avg_payback_years=scen.avg_payback_years,
        curve=scen.curve,
        created_at=scen.created_at
    )

@router.get("/scenarios", response_model=List[ScenarioOut])
def get_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).order_by(Scenario.created_at.desc()).all()
    results = []
    for s in scenarios:
        results.append(ScenarioOut(
            id=s.id,
            run_id=s.run_id,
            name=s.name,
            budget_inr=s.budget_inr,
            n_sites=s.n_sites,
            charger_type=s.charger_type,
            selected_site_ids=s.selected_site_ids or [],
            coverage_before=s.coverage_before,
            coverage_after=s.coverage_after,
            total_cost_inr=s.total_cost_inr,
            avg_payback_years=s.avg_payback_years,
            curve=s.curve or [],
            created_at=s.created_at
        ))
    return results

@router.get("/scenarios/{scenario_id}", response_model=ScenarioOut)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    s = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not s:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    return ScenarioOut(
        id=s.id,
        run_id=s.run_id,
        name=s.name,
        budget_inr=s.budget_inr,
        n_sites=s.n_sites,
        charger_type=s.charger_type,
        selected_site_ids=s.selected_site_ids or [],
        coverage_before=s.coverage_before,
        coverage_after=s.coverage_after,
        total_cost_inr=s.total_cost_inr,
        avg_payback_years=s.avg_payback_years,
        curve=s.curve or [],
        created_at=s.created_at
    )
