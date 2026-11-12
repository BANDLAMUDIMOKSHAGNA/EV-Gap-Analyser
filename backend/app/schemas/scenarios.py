from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class OptimiseRequest(BaseModel):
    budget_inr: float = Field(default=2500000.0, ge=500000.0) # Default ₹25 Lakh
    n_sites: int = Field(default=3, ge=1, le=20)
    charger_type: str = "DC_FAST_60KW"

class OptimiseResponse(BaseModel):
    run_id: str
    budget_inr: float
    n_sites: int
    charger_type: str
    selected_site_ids: List[str]
    selected_sites: List[Dict[str, Any]]
    coverage_before: float
    coverage_after: float
    total_cost_inr: float
    avg_payback_years: float
    solver_status: str
    curve: List[Dict[str, Any]]

class ScenarioSave(BaseModel):
    run_id: str
    name: str
    budget_inr: float
    n_sites: int
    charger_type: str
    selected_site_ids: List[str]
    coverage_before: float
    coverage_after: float
    total_cost_inr: float
    avg_payback_years: float
    curve: Optional[List[Dict[str, Any]]] = None

class ScenarioOut(BaseModel):
    id: str
    run_id: str
    name: str
    budget_inr: float
    n_sites: int
    charger_type: str
    selected_site_ids: List[str]
    coverage_before: float
    coverage_after: float
    total_cost_inr: float
    avg_payback_years: float
    curve: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
