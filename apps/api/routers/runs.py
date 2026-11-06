import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from apps.api.database import get_db, SessionLocal
from apps.api.models import AnalysisRun, CellScore
from apps.api.schemas.runs import RunCreate, RunStatusOut
from pipelines.run import run_pipeline
from typing import List

router = APIRouter(prefix="/runs", tags=["Analysis Runs"])

def _execute_run_background(run_id: str, city_id: str, travel_minutes: int, h3_res: int):
    try:
        run_pipeline(city_id=city_id, travel_minutes=travel_minutes, h3_res=h3_res, run_id=run_id)
    except Exception as e:
        db = SessionLocal()
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
        if run:
            run.status = "FAILED"
            run.params = {**(run.params or {}), "error": str(e)}
            db.commit()
        db.close()

@router.post("", response_model=RunStatusOut)
def create_run(req: RunCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    run_id = f"run_{req.city_id}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    
    run = AnalysisRun(
        id=run_id,
        city_id=req.city_id,
        created_at=datetime.now(timezone.utc),
        travel_minutes=req.travel_minutes,
        h3_res=req.h3_res,
        params={"status": "PROCESSING"},
        status="RUNNING"
    )
    db.add(run)
    db.commit()

    # Dispatch to background task or execute
    background_tasks.add_task(
        _execute_run_background,
        run_id=run_id,
        city_id=req.city_id,
        travel_minutes=req.travel_minutes,
        h3_res=req.h3_res
    )

    return RunStatusOut(
        id=run.id,
        city_id=run.city_id,
        created_at=run.created_at,
        travel_minutes=run.travel_minutes,
        h3_res=run.h3_res,
        status=run.status,
        params=run.params or {},
        scored_cells_count=0
    )

@router.get("", response_model=List[RunStatusOut])
def get_runs(city_id: str = "vizag", db: Session = Depends(get_db)):
    runs = db.query(AnalysisRun).filter(AnalysisRun.city_id == city_id).order_by(AnalysisRun.created_at.desc()).limit(20).all()
    results = []
    for r in runs:
        count = db.query(CellScore).filter(CellScore.run_id == r.id).count()
        results.append(RunStatusOut(
            id=r.id,
            city_id=r.city_id,
            created_at=r.created_at,
            travel_minutes=r.travel_minutes,
            h3_res=r.h3_res,
            status=r.status,
            params=r.params or {},
            scored_cells_count=count
        ))
    return results

@router.get("/{run_id}", response_model=RunStatusOut)
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")

    count = db.query(CellScore).filter(CellScore.run_id == run.id).count()
    return RunStatusOut(
        id=run.id,
        city_id=run.city_id,
        created_at=run.created_at,
        travel_minutes=run.travel_minutes,
        h3_res=run.h3_res,
        status=run.status,
        params=run.params or {},
        scored_cells_count=count
    )
