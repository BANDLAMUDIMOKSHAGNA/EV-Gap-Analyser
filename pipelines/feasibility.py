"""
Feasibility Scoring Engine.
Calculates technical and regulatory feasibility for each cell based on:
1. Substation proximity (grid connection cost and transformer capacity headroom)
2. Land-use suitability (zoning compatibility for commercial charging)
3. Site road accessibility (ingress/egress and arterial connectivity)
"""

from typing import List, Dict, Any

LAND_USE_WEIGHTS = {
    "commercial": 1.0,
    "tech_park": 0.95,
    "coastal_tech": 0.85,
    "transit_hub": 0.90,
    "transit_fringe": 0.75,
    "residential_high": 0.70,
    "residential": 0.65,
    "industrial": 0.60,
    "logistics": 0.75,
    "tourism_recreational": 0.80,
    "agricultural": 0.20
}

def compute_cell_feasibility_scores(cells: List[Dict[str, Any]]) -> List[float]:
    scores = []
    for c in cells:
        # Substation proximity score: 1.0 if <= 300m, decays to 0.1 at 4000m
        dist_sub = float(c.get("dist_substation_m", 1500.0))
        if dist_sub <= 300.0:
            grid_score = 1.0
        elif dist_sub >= 4000.0:
            grid_score = 0.10
        else:
            grid_score = 1.0 - (dist_sub - 300.0) / (4000.0 - 300.0) * 0.90

        # Land use score
        lu = str(c.get("land_use", "commercial")).lower()
        lu_score = LAND_USE_WEIGHTS.get(lu, 0.65)

        # Accessibility score
        access_score = float(c.get("accessibility_score", 0.5))

        # Composite feasibility score [0, 100]
        feasibility = 100.0 * (
            0.45 * grid_score +
            0.35 * lu_score +
            0.20 * access_score
        )
        scores.append(round(feasibility, 2))

    return scores
