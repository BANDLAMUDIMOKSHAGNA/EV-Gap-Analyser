"""
Routing Provider Interface and Implementations.
- OsrmProvider: Queries local/remote OSRM docker instance (/table/v1/driving)
- ApproxProvider: Haversine distance x 1.4 urban detour factor / 24 km/h average speed.
"""

import math
import numpy as np
import httpx
from typing import List, Tuple
from abc import ABC, abstractmethod
from apps.api.config import settings

class RoutingProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_approximate(self) -> bool:
        pass

    @abstractmethod
    def travel_time_matrix(
        self,
        origins: List[Tuple[float, float]], # List of (lat, lon)
        destinations: List[Tuple[float, float]] # List of (lat, lon)
    ) -> np.ndarray: # shape (len(origins), len(destinations)) in minutes
        pass

class ApproxProvider(RoutingProvider):
    """
    Calibrated urban detour routing approximation.
    Formula: haversine_km * 1.4 (detour) / (24 km/h avg speed) * 60 minutes
    """
    def __init__(self, avg_speed_kmh: float = 24.0, detour_factor: float = 1.4):
        self.avg_speed_kmh = avg_speed_kmh
        self.detour_factor = detour_factor

    @property
    def name(self) -> str:
        return "approximate"

    @property
    def is_approximate(self) -> bool:
        return True

    @staticmethod
    def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0 # Earth radius km
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    def travel_time_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]]
    ) -> np.ndarray:
        n_orig = len(origins)
        n_dest = len(destinations)
        matrix = np.zeros((n_orig, n_dest), dtype=float)

        for i, (lat1, lon1) in enumerate(origins):
            for j, (lat2, lon2) in enumerate(destinations):
                dist_km = self._haversine_distance_km(lat1, lon1, lat2, lon2)
                travel_km = dist_km * self.detour_factor
                time_mins = (travel_km / self.avg_speed_kmh) * 60.0
                matrix[i, j] = time_mins

        return matrix

class OsrmProvider(RoutingProvider):
    """
    OSRM table routing via HTTP API. Falls back automatically to ApproxProvider if unreachable.
    """
    def __init__(self, base_url: str = None):
        self.base_url = base_url or settings.OSRM_URL
        self._fallback = ApproxProvider()

    @property
    def name(self) -> str:
        return "osrm"

    @property
    def is_approximate(self) -> bool:
        return False

    def travel_time_matrix(
        self,
        origins: List[Tuple[float, float]],
        destinations: List[Tuple[float, float]]
    ) -> np.ndarray:
        try:
            # OSRM expects coordinates in {lon},{lat} format
            all_coords = [(lon, lat) for lat, lon in origins] + [(lon, lat) for lat, lon in destinations]
            coord_str = ";".join(f"{lon:.6f},{lat:.6f}" for lon, lat in all_coords)
            
            src_indices = ";".join(str(i) for i in range(len(origins)))
            dest_indices = ";".join(str(len(origins) + j) for j in range(len(destinations)))

            url = f"{self.base_url}/table/v1/driving/{coord_str}?sources={src_indices}&destinations={dest_indices}"
            
            with httpx.Client(timeout=4.0) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    # OSRM returns durations in seconds -> convert to minutes
                    durations_sec = np.array(data["durations"], dtype=float)
                    return durations_sec / 60.0
        except Exception as e:
            pass # Fallback seamlessly to calibrated approximate provider
        
        return self._fallback.travel_time_matrix(origins, destinations)

def get_routing_provider(provider_name: str = None) -> RoutingProvider:
    choice = provider_name or settings.ROUTING_PROVIDER
    if choice.lower() == "osrm":
        return OsrmProvider()
    return ApproxProvider()
