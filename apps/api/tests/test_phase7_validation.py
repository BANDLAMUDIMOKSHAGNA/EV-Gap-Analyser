import pytest
from pipelines.validation import run_backtest_validation, run_coverage_improvement_audit, run_rank_correlation_benchmark

def test_backtest_validation_hit_rate():
    res = run_backtest_validation("vizag", hide_ratio=0.30, proximity_km=2.5)
    assert "hit_rate_pct" in res
    assert res["hit_rate_pct"] >= 50.0
    assert res["validation_passed"] is True
    assert res["mean_error_distance_km"] < 3.0

def test_coverage_improvement_audit():
    res = run_coverage_improvement_audit("vizag")
    assert res["coverage_improvement_valid"] is True
    assert res["total_hexagons"] > 0
    assert res["cells_served_before"] > 0

def test_rank_correlation_computation():
    t_scores = [90.0, 80.0, 70.0, 60.0]
    e_scores = [95.0, 85.0, 75.0, 65.0]
    res = run_rank_correlation_benchmark(t_scores, e_scores)
    assert res["spearman_rho"] == 1.0
    assert res["correlation_is_positive"] is True
