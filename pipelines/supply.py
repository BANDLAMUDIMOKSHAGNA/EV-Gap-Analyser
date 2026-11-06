"""
Supply Scoring Engine.
Computes road travel time + distance to nearest charger and count of chargers within N minutes.
Uses exponential decay weighting over travel time.
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple
from pipelines.routing import RoutingProvider, get_routing_provider

def compute_cell_supply_scores(
    cells: List[Dict[str, Any]],
    chargers: List[Dict[str, Any]],
    travel_minutes: int = 10,
    routing_provider: RoutingProvider = None
) -> List[Dict[str, Any]]:
    """
    Computes supply score per cell using travel time decay weighting.
    """
    if routing_provider is None:
        routing_provider = get_routing_provider()

    if not chargers:
        # No chargers in city -> 0 supply for all cells
        results = []
        for c in cells:
            results.append({
                "cell_id": c["h3_index"],
                "supply_score": 0.0,
                "nearest_charger_m": 99999.0,
                "nearest_charger_min": 999.0,
                "chargers_in_reach": 0
            })
        return results

    cell_coords: List[Tuple[float, float]] = [(c["lat"], c["lon"]) for c in cells]
    charger_coords: List[Tuple[float, float]] = [(ch["lat"], ch["lon"]) for ch in chargers]
    charger_powers = np.array([ch.get("power_kw", 30.0) for ch in chargers], dtype=float)

    # Matrix shape: (num_cells, num_chargers) in minutes
    time_matrix = routing_provider.travel_time_matrix(cell_coords, charger_coords)

    decay_tau = travel_minutes / 2.0 # Half-life decay at half max travel time

    results = []
    raw_supply_values = []

    for i, c in enumerate(cells):
        times = time_matrix[i]
        min_idx = int(np.argmin(times))
        nearest_min = round(float(times[min_idx]), 1)

        # Haversine distance in meters to nearest charger
        r_earth = 6371000.0
        lat1, lon1 = math.radians(c["lat"]), math.radians(c["lon"])
        lat2, lon2 = math.radians(chargers[min_idx]["lat"]), math.radians(chargers[min_idx]["lon"])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
        nearest_m = round(2 * r_earth * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 0)

        # Filter chargers reachable within threshold
        in_reach_mask = times <= travel_minutes
        chargers_in_reach = int(np.sum(in_reach_mask))

        # Exponential decay weighted supply power sum
        # Supply = Sum( Power_s * exp(-time_s / tau) )
        decay_weights = np.exp(-times[in_reach_mask] / decay_tau)
        weighted_power = float(np.sum(charger_powers[in_reach_mask] * decay_weights))

        raw_supply_values.append(weighted_power)

        results.append({
            "cell_id": c["h3_index"],
            "raw_supply": weighted_power,
            "nearest_charger_m": nearest_m,
            "nearest_charger_min": nearest_min,
            "chargers_in_reach": chargers_in_reach
        })

    # Normalise supply score to 0 - 100
    max_raw = max(raw_supply_values) if raw_supply_values else 1.0
    min_raw = min(raw_supply_values) if raw_supply_values else 0.0
    denom = max_raw - min_raw if max_raw > min_raw else 1.0

    for r in results:
        norm_score = round(100.0 * (r["raw_supply"] - min_raw) / denom, 2)
        r["supply_score"] = norm_score
        del r["raw_supply"]

    return results
