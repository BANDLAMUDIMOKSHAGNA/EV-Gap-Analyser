from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class RankRequest(BaseModel):
    weights: Optional[Dict[str, float]] = None # {"demand": 30, "population": 20, ...}
    ahp_matrix: Optional[List[List[float]]] = None

class CandidateSiteOut(BaseModel):
    id: str
    run_id: str
    cluster_id: Optional[int] = None
    lat: float
    lon: float
    name: str
    zone: Optional[str] = None
    topsis_score: float
    rank: int
    est_daily_sessions: float
    est_cost_inr: float
    payback_years: float
    criteria_breakdown: Dict[str, float]
    criteria_raw: Optional[Dict[str, float]] = None

class RankingResponse(BaseModel):
    run_id: str
    weights_applied: Dict[str, float]
    consistency_ratio: float
    is_consistent: bool
    sites: List[CandidateSiteOut]
