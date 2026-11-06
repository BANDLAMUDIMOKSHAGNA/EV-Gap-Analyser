import pytest
import numpy as np
from pipelines.ranking import derive_ahp_weights, rank_candidates_topsis, CRITERIA_KEYS

def test_ahp_weights_sum_to_one():
    """
    Unit test: AHP weights derived from pairwise comparison matrix must sum strictly to 1.0
    and consistency ratio must be computed.
    """
    weights, cr, is_consistent = derive_ahp_weights()
    assert len(weights) == 6
    total = sum(weights.values())
    assert abs(total - 1.0) < 1e-3, f"AHP weights sum is {total}, expected 1.0"
    assert cr >= 0.0
    assert isinstance(is_consistent, bool)

def test_ahp_inconsistent_matrix_detected():
    """
    Unit test: A severely inconsistent pairwise comparison matrix must have CR > 0.10
    and is_consistent == False.
    """
    # Extremely inconsistent matrix
    inconsistent_matrix = [
        [1.0, 9.0, 1.0, 0.1, 8.0, 1.0],
        [0.11, 1.0, 9.0, 1.0, 0.1, 7.0],
        [1.0, 0.11, 1.0, 9.0, 1.0, 0.1],
        [10.0, 1.0, 0.11, 1.0, 9.0, 1.0],
        [0.12, 10.0, 1.0, 0.11, 1.0, 9.0],
        [1.0, 0.14, 10.0, 1.0, 0.11, 1.0]
    ]
    weights, cr, is_consistent = derive_ahp_weights(inconsistent_matrix)
    assert cr > 0.10
    assert is_consistent is False

def test_topsis_ordering_on_known_example():
    """
    Unit test: TOPSIS ordering on a known example.
    Candidate A strictly dominates Candidate B across all benefit criteria.
    Candidate A MUST achieve a higher TOPSIS score and rank 1.
    """
    candidate_a = {
        "cluster_id": 1,
        "lat": 17.72,
        "lon": 83.30,
        "name": "Dominant Candidate A",
        "zone": "commercial",
        "criteria_raw": {
            "demand": 95.0,
            "population": 5000.0,
            "grid": 90.0,
            "land_use": 100.0,
            "accessibility": 95.0,
            "competition": 90.0
        },
        "mean_sub_dist_m": 400.0
    }
    candidate_b = {
        "cluster_id": 2,
        "lat": 17.65,
        "lon": 83.20,
        "name": "Inferior Candidate B",
        "zone": "industrial",
        "criteria_raw": {
            "demand": 25.0,
            "population": 800.0,
            "grid": 30.0,
            "land_use": 60.0,
            "accessibility": 40.0,
            "competition": 20.0
        },
        "mean_sub_dist_m": 3200.0
    }

    weights = {k: 100.0 / 6 for k in CRITERIA_KEYS}
    ranked = rank_candidates_topsis([candidate_b, candidate_a], weights)

    assert len(ranked) == 2
    assert ranked[0]["name"] == "Dominant Candidate A"
    assert ranked[0]["rank"] == 1
    assert ranked[1]["name"] == "Inferior Candidate B"
    assert ranked[1]["rank"] == 2
    assert ranked[0]["topsis_score"] > ranked[1]["topsis_score"]
    assert "criteria_breakdown" in ranked[0]
