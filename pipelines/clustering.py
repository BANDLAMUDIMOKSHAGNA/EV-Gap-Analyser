"""
Hotspot Spatial Clustering Engine using DBSCAN.
Groups high-gap H3 cells into contiguous clusters to extract optimal candidate charging sites.
"""

import math
import numpy as np
from typing import List, Dict, Any
from sklearn.cluster import DBSCAN

def cluster_high_gap_cells(
    cells: List[Dict[str, Any]],
    scores: List[Dict[str, Any]],
    min_gap_threshold: float = 60.0,
    eps_km: float = 1.2,
    min_samples: int = 2
) -> List[Dict[str, Any]]:
    """
    Filters cells with gap_score >= min_gap_threshold, applies DBSCAN clustering,
    and returns candidate site definitions.
    """
    # Join cell attributes with their scores
    score_lookup = {s["cell_id"]: s for s in scores}
    high_gap_cells = []

    for c in cells:
        sc = score_lookup.get(c["h3_index"])
        if sc and sc.get("gap_score", 0.0) >= min_gap_threshold:
            high_gap_cells.append({
                **c,
                **sc
            })

    if not high_gap_cells:
        # If no cells exceed threshold, take top 10% cells
        sorted_cells = sorted(cells, key=lambda x: score_lookup.get(x["h3_index"], {}).get("gap_score", 0.0), reverse=True)
        high_gap_cells = [{**c, **score_lookup.get(c["h3_index"], {})} for c in sorted_cells[:max(5, len(cells) // 10)]]

    # Coordinates in radians for haversine DBSCAN
    coords = np.array([[math.radians(c["lat"]), math.radians(c["lon"])] for c in high_gap_cells])
    # 6371.0 km radius -> eps in radians
    kms_per_radian = 6371.0
    epsilon_rad = eps_km / kms_per_radian

    db = DBSCAN(eps=epsilon_rad, min_samples=min_samples, metric="haversine")
    labels = db.fit_predict(coords)

    clusters: Dict[int, List[Dict[str, Any]]] = {}
    for idx, label in enumerate(labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(high_gap_cells[idx])

    candidate_sites = []
    cluster_counter = 1

    # Name dictionary mapping zones to realistic charging station facility names
    zone_names_map = {
        "commercial": "Commercial Plaza Hub",
        "tech_park": "IT SEZ Fast Charge Park",
        "coastal_tech": "Coastal Innovation Hub",
        "transit_hub": "Inter-modal Transit Hub",
        "transit_fringe": "Arterial Junction Station",
        "residential_high": "Urban Residential Community Hub",
        "logistics": "Logistics & Fleet Depot",
        "industrial": "Industrial Corridor Station"
    }

    for label, group in clusters.items():
        if label == -1 and len(group) > 3:
            # Noise points: group into singletons if high gap
            group = group[:3]

        mean_lat = float(np.mean([c["lat"] for c in group]))
        mean_lon = float(np.mean([c["lon"] for c in group]))
        mean_demand = float(np.mean([c["demand_score"] for c in group]))
        mean_pop = float(np.mean([c["population"] for c in group]))
        mean_sub_dist = float(np.mean([c["dist_substation_m"] for c in group]))
        mean_access = float(np.mean([c["accessibility_score"] for c in group])) * 100.0
        mean_comp_dist = float(np.mean([c["nearest_charger_m"] for c in group]))

        # Dominant land use
        land_uses = [c.get("land_use", "commercial") for c in group]
        dom_lu = max(set(land_uses), key=land_uses.count)

        zone_label = zone_names_map.get(dom_lu, "Urban Multi-Gun Hub")
        site_name = f"Vizag {zone_label} (Cluster #{cluster_counter})"

        # Raw multi-criteria attributes for ranking
        # Grid proximity: 100 if dist <= 300m, decays to 10 at 4000m
        grid_score = max(10.0, 100.0 - (mean_sub_dist / 40.0))
        # Competition score: greater distance to existing chargers = higher score (less competition)
        comp_score = min(100.0, max(10.0, (mean_comp_dist / 30.0)))
        # Land use score
        lu_score = 100.0 if dom_lu in ["commercial", "tech_park", "transit_hub"] else 75.0

        site = {
            "cluster_id": cluster_counter,
            "lat": round(mean_lat, 6),
            "lon": round(mean_lon, 6),
            "name": site_name,
            "zone": dom_lu,
            "cell_count": len(group),
            "criteria_raw": {
                "demand": round(mean_demand, 2),
                "population": round(mean_pop, 1),
                "grid": round(grid_score, 2),
                "land_use": round(lu_score, 2),
                "accessibility": round(mean_access, 2),
                "competition": round(comp_score, 2)
            },
            "mean_sub_dist_m": round(mean_sub_dist, 0),
            "mean_nearest_charger_m": round(mean_comp_dist, 0)
        }
        candidate_sites.append(site)
        cluster_counter += 1

    return candidate_sites
