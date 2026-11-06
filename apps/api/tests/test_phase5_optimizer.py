import pytest
from pipelines.optimizer import solve_maximal_coverage_budget

def test_optimizer_strictly_respects_budget():
    """
    Unit test: CP-SAT optimizer must strictly respect the budget constraint.
    Total cost of chosen candidates <= budget_inr.
    Number of chosen candidates <= max_sites.
    """
    candidates = [
        {"id": "c1", "cluster_id": 1, "lat": 17.72, "lon": 83.30, "est_cost_inr": 800000.0, "payback_years": 2.5},
        {"id": "c2", "cluster_id": 2, "lat": 17.75, "lon": 83.33, "est_cost_inr": 1200000.0, "payback_years": 3.0},
        {"id": "c3", "cluster_id": 3, "lat": 17.78, "lon": 83.36, "est_cost_inr": 1500000.0, "payback_years": 3.2},
        {"id": "c4", "cluster_id": 4, "lat": 17.68, "lon": 83.21, "est_cost_inr": 2000000.0, "payback_years": 4.0},
    ]

    cells = [
        {"h3_index": f"cell_{i}", "lat": 17.70 + (i * 0.01), "lon": 83.25 + (i * 0.01), "demand_score": 50.0 + (i % 30)}
        for i in range(25)
    ]

    budget = 1800000.0 # ₹18 Lakh: Can afford c1+c2 (2.0M is over, but c1=0.8M + c2=1.2M is 2.0M so it can only afford c1 alone or c2 alone!)
    max_sites = 2

    res = solve_maximal_coverage_budget(
        candidates=candidates,
        cells=cells,
        existing_coverage_indices={0, 1, 2},
        budget_inr=budget,
        max_sites=max_sites,
        travel_minutes=10
    )

    assert res["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert res["total_cost_inr"] <= budget, (
        f"Total cost {res['total_cost_inr']} exceeded budget {budget}!"
    )
    assert len(res["selected_site_ids"]) <= max_sites
    assert res["coverage_after"] >= res["coverage_before"]
    assert len(res["curve"]) == 10
