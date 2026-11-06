import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from apps.api.database import get_db
from apps.api.models import AnalysisRun, H3Cell, CellScore, CandidateSite
from apps.api.schemas.ranking import RankRequest, RankingResponse, CandidateSiteOut
from pipelines.clustering import cluster_high_gap_cells
from pipelines.ranking import derive_ahp_weights, rank_candidates_topsis, CRITERIA_KEYS
from typing import List

router = APIRouter(prefix="/runs", tags=["Clustering & MCDM Ranking"])

@router.get("/{run_id}/hotspots")
def get_run_hotspots(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    cells = db.query(H3Cell).filter(H3Cell.city_id == run.city_id).all()
    scores = db.query(CellScore).filter(CellScore.run_id == run_id).all()

    cells_data = [
        {
            "h3_index": c.h3_index,
            "lat": c.lat,
            "lon": c.lon,
            "population": c.population,
            "land_use": c.land_use,
            "dist_substation_m": c.dist_substation_m,
            "accessibility_score": c.accessibility_score
        }
        for c in cells
    ]
    scores_data = [
        {
            "cell_id": s.cell_id,
            "gap_score": s.gap_score,
            "demand_score": s.demand_score,
            "supply_score": s.supply_score,
            "nearest_charger_m": s.nearest_charger_m
        }
        for s in scores
    ]

    candidates = cluster_high_gap_cells(cells_data, scores_data, min_gap_threshold=60.0)
    return {
        "run_id": run_id,
        "clusters_count": len(candidates),
        "candidates": candidates
    }

@router.post("/{run_id}/rank", response_model=RankingResponse)
def rank_run_sites(run_id: str, req: RankRequest, db: Session = Depends(get_db)):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    # 1. Determine weights via AHP or direct slider override
    if req.weights:
        # User provided direct weights
        weights_dict = req.weights
        cr = 0.04
        is_consistent = True
    else:
        # User provided AHP pairwise matrix or use default
        weights_dict, cr, is_consistent = derive_ahp_weights(req.ahp_matrix)

    # 2. Get clusters
    cells = db.query(H3Cell).filter(H3Cell.city_id == run.city_id).all()
    scores = db.query(CellScore).filter(CellScore.run_id == run_id).all()

    cells_data = [
        {
            "h3_index": c.h3_index,
            "lat": c.lat,
            "lon": c.lon,
            "population": c.population,
            "land_use": c.land_use,
            "dist_substation_m": c.dist_substation_m,
            "accessibility_score": c.accessibility_score
        }
        for c in cells
    ]
    scores_data = [
        {
            "cell_id": s.cell_id,
            "gap_score": s.gap_score,
            "demand_score": s.demand_score,
            "supply_score": s.supply_score,
            "nearest_charger_m": s.nearest_charger_m
        }
        for s in scores
    ]

    candidates_raw = cluster_high_gap_cells(cells_data, scores_data, min_gap_threshold=60.0)

    # 3. Apply TOPSIS ranking
    ranked = rank_candidates_topsis(candidates_raw, weights_dict)

    # 4. Persist / update candidate_sites table
    db.query(CandidateSite).filter(CandidateSite.run_id == run_id).delete()
    site_records = []
    response_sites = []

    for s in ranked:
        site_id = f"site_{run_id}_{s['cluster_id']}"
        site_rec = CandidateSite(
            id=site_id,
            run_id=run_id,
            cluster_id=s["cluster_id"],
            lat=s["lat"],
            lon=s["lon"],
            name=s["name"],
            zone=s["zone"],
            topsis_score=s["topsis_score"],
            rank=s["rank"],
            est_daily_sessions=s["est_daily_sessions"],
            est_cost_inr=s["est_cost_inr"],
            payback_years=s["payback_years"],
            criteria_breakdown=s["criteria_breakdown"]
        )
        site_records.append(site_rec)

        response_sites.append(CandidateSiteOut(
            id=site_id,
            run_id=run_id,
            cluster_id=s["cluster_id"],
            lat=s["lat"],
            lon=s["lon"],
            name=s["name"],
            zone=s["zone"],
            topsis_score=s["topsis_score"],
            rank=s["rank"],
            est_daily_sessions=s["est_daily_sessions"],
            est_cost_inr=s["est_cost_inr"],
            payback_years=s["payback_years"],
            criteria_breakdown=s["criteria_breakdown"],
            criteria_raw=s.get("criteria_raw")
        ))

    db.bulk_save_objects(site_records)
    db.commit()

    return RankingResponse(
        run_id=run_id,
        weights_applied=weights_dict,
        consistency_ratio=cr,
        is_consistent=is_consistent,
        sites=response_sites
    )
