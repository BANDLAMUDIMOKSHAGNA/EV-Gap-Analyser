"""
H3 Hexagonal Spatial Discretization and Urban Feature Extraction.
Generates H3 cells covering the city boundary and calculates:
- Population density
- EV registrations
- Road density & accessibility score
- POI counts (malls, transit, tech hubs, offices, fuel stations)
- Substation distance
"""

import json
import math
import h3
import csv
from pathlib import Path
from typing import List, Dict, Any
from apps.api.database import SessionLocal
from apps.api.models import H3Cell, City

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config" / "cities"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0 # meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2.0)**2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

def generate_h3_grid(city_id: str = "vizag", res: int = 8) -> List[Dict[str, Any]]:
    config_file = CONFIG_DIR / f"{city_id}.json"
    if not config_file.exists():
        raise FileNotFoundError(f"City configuration not found: {config_file}")

    with open(config_file, "r", encoding="utf-8") as f:
        config = json.load(f)

    # City polygon is list of [lon, lat] -> H3 LatLngPoly expects list of (lat, lon)
    boundary_coords = [(pt[1], pt[0]) for pt in config["boundary_polygon"]]
    poly = h3.LatLngPoly(boundary_coords)
    cell_indices = list(h3.polygon_to_cells(poly, res=res))

    # Load substations
    substations = []
    substations_file = DATA_DIR / "sample" / f"substations_{city_id}.csv"
    if substations_file.exists():
        with open(substations_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                substations.append({"lat": float(r["lat"]), "lon": float(r["lon"]), "name": r["name"]})

    # Load POIs
    pois = []
    pois_file = DATA_DIR / "sample" / f"pois_{city_id}.csv"
    if pois_file.exists():
        with open(pois_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                pois.append({"lat": float(r["lat"]), "lon": float(r["lon"]), "category": r["category"], "name": r["name"]})

    # Zones defined in config
    zones = config.get("zones", [])

    cells_data = []
    db = SessionLocal()
    try:
        for idx in cell_indices:
            lat, lon = h3.cell_to_latlng(idx)

            # Find nearest zone to assign representative land use and urban profile
            min_zone_dist = float("inf")
            nearest_zone = {"name": "Urban Core", "type": "commercial"}
            for z in zones:
                d = haversine_distance_m(lat, lon, z["lat"], z["lon"])
                if d < min_zone_dist:
                    min_zone_dist = d
                    nearest_zone = z

            # Substation distance
            min_sub_dist = 9999.0
            for s in substations:
                sd = haversine_distance_m(lat, lon, s["lat"], s["lon"])
                if sd < min_sub_dist:
                    min_sub_dist = sd

            # POI counts within 800m of cell centroid
            poi_counts = {
                "malls": 0,
                "transit": 0,
                "offices": 0,
                "tech_hub": 0,
                "fuel_stations": 0,
                "hospitals": 0,
                "parking": 0
            }
            for p in pois:
                pd = haversine_distance_m(lat, lon, p["lat"], p["lon"])
                if pd <= 1000.0:
                    cat = p["category"]
                    if "mall" in cat:
                        poi_counts["malls"] += 1
                    elif "transit" in cat:
                        poi_counts["transit"] += 1
                    elif "tech" in cat:
                        poi_counts["tech_hub"] += 1
                    elif "hospital" in cat:
                        poi_counts["hospitals"] += 1
                    elif "fuel" in cat:
                        poi_counts["fuel_stations"] += 1
                    elif "parking" in cat:
                        poi_counts["parking"] += 1
                    else:
                        poi_counts["offices"] += 1

            # Synthetic calibrated population density (falloff from zone center)
            zone_proximity_factor = max(0.1, 1.0 - (min_zone_dist / 6000.0))
            if nearest_zone.get("type") in ["residential_high", "commercial"]:
                base_pop = 3500.0 * zone_proximity_factor
            elif nearest_zone.get("type") in ["tech_park", "coastal_tech"]:
                base_pop = 2200.0 * zone_proximity_factor
            else:
                base_pop = 1200.0 * zone_proximity_factor

            # EV registrations calibrated to zone factor & commercial density
            ev_count = round(base_pop * 0.045 + (poi_counts["tech_hub"] + poi_counts["malls"]) * 15.0, 1)

            # Road density (km / km2)
            road_density = round(2.5 + zone_proximity_factor * 4.5, 2)
            accessibility_score = round(min(1.0, 0.35 + zone_proximity_factor * 0.5 + (0.1 if road_density > 4.0 else 0.0)), 2)

            cell_record = {
                "h3_index": idx,
                "city_id": city_id,
                "res": res,
                "lat": lat,
                "lon": lon,
                "population": round(base_pop, 0),
                "ev_count": ev_count,
                "road_density": road_density,
                "poi_counts": poi_counts,
                "land_use": nearest_zone.get("type", "commercial"),
                "dist_substation_m": round(min_sub_dist, 1),
                "accessibility_score": accessibility_score
            }
            cells_data.append(cell_record)

            # Upsert into DB
            existing_cell = db.query(H3Cell).filter(H3Cell.h3_index == idx).first()
            if not existing_cell:
                new_cell = H3Cell(**cell_record)
                db.add(new_cell)
            else:
                for k, v in cell_record.items():
                    setattr(existing_cell, k, v)

        db.commit()
        print(f"Generated and persisted {len(cells_data)} H3 cells (res {res}) for {city_id}.")
    finally:
        db.close()

    return cells_data

if __name__ == "__main__":
    generate_h3_grid("vizag", res=8)
