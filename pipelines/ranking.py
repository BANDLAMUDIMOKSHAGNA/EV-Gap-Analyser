"""
Multi-Criteria Decision Making (MCDM) Engine:
1. Analytic Hierarchy Process (AHP) for criteria weight derivation & consistency verification
2. TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
3. Financial Feasibility & Payback Estimation per Site
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple

CRITERIA_KEYS = ["demand", "population", "grid", "land_use", "accessibility", "competition"]

# Saaty's standard Random Consistency Index (RI) table
RANDOM_INDEX = {
    1: 0.00,
    2: 0.00,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49
}

# Baseline pairwise comparison matrix for 6 criteria:
# 1. Demand, 2. Population, 3. Grid proximity, 4. Land use, 5. Accessibility, 6. Competition
DEFAULT_AHP_MATRIX = [
    [1.0,  2.0,  3.0,  3.0,  4.0,  5.0], # Demand
    [0.5,  1.0,  2.0,  2.0,  3.0,  4.0], # Population
    [0.33, 0.5,  1.0,  2.0,  2.0,  3.0], # Grid
    [0.33, 0.5,  0.5,  1.0,  2.0,  3.0], # Land Use
    [0.25, 0.33, 0.5,  0.5,  1.0,  2.0], # Accessibility
    [0.20, 0.25, 0.33, 0.33, 0.5,  1.0]  # Competition
]

def derive_ahp_weights(matrix: List[List[float]] = None) -> Tuple[Dict[str, float], float, bool]:
    """
    Computes eigenvector weights and Consistency Ratio (CR) from pairwise matrix.
    Returns (weights_dict, consistency_ratio, is_consistent).
    """
    if matrix is None:
        matrix = DEFAULT_AHP_MATRIX

    A = np.array(matrix, dtype=float)
    n = A.shape[0]

    # Geometric mean method for principal eigenvector
    geom_means = np.prod(A, axis=1) ** (1.0 / n)
    weights = geom_means / np.sum(geom_means)

    # Calculate lambda_max
    Aw = np.dot(A, weights)
    lambda_max = float(np.mean(Aw / weights))

    # Consistency Index & Ratio
    ci = (lambda_max - n) / (n - 1) if n > 1 else 0.0
    ri = RANDOM_INDEX.get(n, 1.24)
    cr = float(ci / ri) if ri > 0 else 0.0

    is_consistent = cr <= 0.10

    weights_dict = {
        key: round(float(w), 4)
        for key, w in zip(CRITERIA_KEYS, weights)
    }

    return weights_dict, round(cr, 4), is_consistent

def rank_candidates_topsis(
    candidates: List[Dict[str, Any]],
    weights: Dict[str, float]
) -> List[Dict[str, Any]]:
    """
    Ranks candidate sites using TOPSIS.
    Returns ranked sites with per-criterion contribution breakdown and financial projections.
    """
    if not candidates:
        return []

    # Normalize weights so they sum strictly to 1.0
    total_w = sum(weights.get(k, 0.0) for k in CRITERIA_KEYS)
    norm_w = {k: weights.get(k, 0.0) / total_w for k in CRITERIA_KEYS}

    # Build decision matrix X of shape (m, n)
    m = len(candidates)
    n = len(CRITERIA_KEYS)
    X = np.zeros((m, n), dtype=float)

    for i, c in enumerate(candidates):
        raw = c.get("criteria_raw", {})
        for j, k in enumerate(CRITERIA_KEYS):
            X[i, j] = float(raw.get(k, 50.0))

    # 1. Normalize decision matrix R
    col_norms = np.sqrt(np.sum(X**2, axis=0))
    col_norms[col_norms == 0] = 1.0
    R = X / col_norms

    # 2. Weighted normalized matrix V
    w_vec = np.array([norm_w[k] for k in CRITERIA_KEYS])
    V = R * w_vec

    # 3. Determine ideal best (A+) and ideal worst (A-)
    # All 6 criteria are benefit criteria (higher is better)
    A_plus = np.max(V, axis=0)
    A_minus = np.min(V, axis=0)

    # 4. Separation measures
    S_plus = np.sqrt(np.sum((V - A_plus)**2, axis=1))
    S_minus = np.sqrt(np.sum((V - A_minus)**2, axis=1))

    # 5. Closeness coefficient C_i
    denom = S_plus + S_minus
    denom[denom == 0] = 1.0
    C = S_minus / denom

    ranked_sites = []
    for i, c in enumerate(candidates):
        topsis_score = round(float(C[i] * 100.0), 2)

        # Calculate per-criterion positive contribution percentage
        diff_sq = (V[i] - A_minus)**2
        total_diff_sq = np.sum(diff_sq)
        if total_diff_sq == 0:
            contributions = {k: round(100.0 / n, 1) for k in CRITERIA_KEYS}
        else:
            contributions = {
                k: round(float((diff_sq[j] / total_diff_sq) * 100.0), 1)
                for j, k in enumerate(CRITERIA_KEYS)
            }

        # Financial projections
        # Demand score drives estimated daily sessions (e.g. 5 to 16 sessions/day)
        demand_val = c.get("criteria_raw", {}).get("demand", 50.0)
        est_daily_sessions = round(4.0 + (demand_val / 100.0) * 11.0, 1)

        # CapEx estimate (Dual 60kW DC Fast)
        sub_dist = c.get("mean_sub_dist_m", 1000.0)
        grid_cost = 200000.0 + min(sub_dist, 3000.0) * 450.0 # base connection + ₹450/m cable
        hardware_cost = 850000.0 # ₹8.5 Lakh
        civil_cost = 150000.0 # ₹1.5 Lakh
        total_capex = hardware_cost + civil_cost + grid_cost + 50000.0 # ₹50k permits

        # Annual Net Cash Flow
        kwh_per_session = 28.0
        retail_kwh = 16.50
        electricity_cost = 7.20
        margin_per_kwh = retail_kwh - electricity_cost # ₹9.30/kWh
        gross_margin_annual = est_daily_sessions * 365.0 * (kwh_per_session * margin_per_kwh + 50.0) # margin + fee
        opex_annual = 120000.0 + (total_capex * 0.08) # rent + maintenance
        net_annual_profit = max(50000.0, gross_margin_annual - opex_annual)

        payback_years = round(total_capex / net_annual_profit, 1)

        ranked_sites.append({
            **c,
            "topsis_score": topsis_score,
            "est_daily_sessions": est_daily_sessions,
            "est_cost_inr": round(total_capex, 0),
            "payback_years": payback_years,
            "criteria_breakdown": contributions
        })

    # Sort descending by topsis_score
    ranked_sites.sort(key=lambda x: x["topsis_score"], reverse=True)
    for rank_idx, s in enumerate(ranked_sites, 1):
        s["rank"] = rank_idx

    return ranked_sites
