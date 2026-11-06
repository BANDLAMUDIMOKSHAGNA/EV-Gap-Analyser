import pytest
import numpy as np
from pipelines.gap import compute_gap_scores
from pipelines.routing import ApproxProvider
from pipelines.demand import DemandModel
from pipelines.supply import compute_cell_supply_scores

def test_gap_score_monotonicity():
    """
    Unit test: Gap score monotonicity.
    More nearby chargers (higher supply) MUST lead to lower or equal gap score
    when demand is held constant.
    """
    fixed_demand = [80.0, 80.0, 80.0, 80.0]
    increasing_supply = [10.0, 30.0, 60.0, 90.0]

    gap_scores = compute_gap_scores(fixed_demand, increasing_supply)

    # Verify that each successive gap score is less than or equal to the previous
    for i in range(len(gap_scores) - 1):
        assert gap_scores[i] >= gap_scores[i+1], (
            f"Monotonicity violated: gap at supply={increasing_supply[i]} is {gap_scores[i]}, "
            f"which is less than gap at supply={increasing_supply[i+1]} ({gap_scores[i+1]})"
        )

def test_approx_routing_provider():
    """
    Unit test: Calibrated urban detour routing approximation.
    Distance = 10 km.
    Detour factor = 1.4 -> Travel km = 14 km.
    Speed = 24 km/h -> Time = (14 / 24) * 60 = 35.0 minutes.
    """
    provider = ApproxProvider(avg_speed_kmh=24.0, detour_factor=1.4)
    # 1 degree of latitude is approximately 111.195 km -> 0.08993 degrees is ~10 km
    origin = [(17.70, 83.30)]
    dest = [(17.79, 83.30)] # approx 10.0 km north

    matrix = provider.travel_time_matrix(origin, dest)
    assert matrix.shape == (1, 1)
    duration_min = matrix[0, 0]
    # Expected: around 34 - 36 minutes
    assert 30.0 <= duration_min <= 40.0, f"Unexpected duration: {duration_min}"

def test_demand_regressor_output():
    """
    Unit test: Demand GradientBoostingRegressor produces valid bounded scores [0, 100]
    and honest model evaluation metrics.
    """
    cells = [
        {
            "h3_index": f"cell_{i}",
            "population": 1000 + i * 50,
            "ev_count": 50 + i * 2,
            "road_density": 2.0 + (i % 5) * 0.5,
            "poi_counts": {"malls": i % 3, "transit": i % 2, "tech_hub": 1 if i > 10 else 0, "fuel_stations": 1},
            "accessibility_score": 0.5 + (i % 4) * 0.1
        }
        for i in range(40)
    ]

    model = DemandModel()
    scores, metrics = model.train_and_predict(cells)
    assert len(scores) == len(cells)
    assert all(0.0 <= s <= 100.0 for s in scores)
    assert "r2_score" in metrics
    assert "mae" in metrics
    assert "feature_importances" in metrics
