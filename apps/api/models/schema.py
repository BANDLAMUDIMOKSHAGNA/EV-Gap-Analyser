from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime
from apps.api.database import Base

class City(Base):
    __tablename__ = "cities"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    country = Column(String(50), default="India")
    boundary_geojson = Column(JSON, nullable=False) # MultiPolygon / Polygon
    default_h3_res = Column(Integer, default=8)
    lat_center = Column(Float, nullable=False)
    lon_center = Column(Float, nullable=False)

    chargers = relationship("Charger", back_populates="city", cascade="all, delete-orphan")
    cells = relationship("H3Cell", back_populates="city", cascade="all, delete-orphan")
    runs = relationship("AnalysisRun", back_populates="city", cascade="all, delete-orphan")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(50), primary_key=True)
    name = Column(String(150), nullable=False)
    source = Column(String(150), nullable=False)
    url = Column(String(500), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow)
    licence = Column(String(100), nullable=False)
    is_demo = Column(Boolean, default=False)
    description = Column(Text, nullable=True)


class Charger(Base):
    __tablename__ = "chargers"

    id = Column(String(100), primary_key=True)
    city_id = Column(String(50), ForeignKey("cities.id"), nullable=False)
    name = Column(String(200), nullable=False)
    operator = Column(String(100), nullable=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    connector_types = Column(JSON, default=list) # e.g. ["CCS2", "Type 2", "Bharat DC001"]
    power_kw = Column(Float, default=30.0)
    charger_type = Column(String(50), default="DC_FAST") # DC_FAST, AC_SLOW, AC_TYPE2
    status = Column(String(50), default="OPERATIONAL") # OPERATIONAL, PLANNED, OFFLINE
    source = Column(String(100), default="BEE_REGISTRY") # OSM, BEE_REGISTRY, SNA
    updated_at = Column(DateTime, default=datetime.utcnow)

    city = relationship("City", back_populates="chargers")

    __table_args__ = (
        Index("idx_chargers_coords", "lat", "lon"),
        Index("idx_chargers_city", "city_id"),
    )


class H3Cell(Base):
    __tablename__ = "h3_cells"

    h3_index = Column(String(25), primary_key=True)
    city_id = Column(String(50), ForeignKey("cities.id"), nullable=False)
    res = Column(Integer, default=8)
    lat = Column(Float, nullable=False) # centroid lat
    lon = Column(Float, nullable=False) # centroid lon
    population = Column(Float, default=0.0)
    ev_count = Column(Float, default=0.0)
    road_density = Column(Float, default=0.0) # km of road per km2
    poi_counts = Column(JSON, default=dict) # {"malls": 2, "offices": 5, "transit": 1, ...}
    land_use = Column(String(50), default="commercial") # commercial, residential, industrial, transport
    dist_substation_m = Column(Float, default=1000.0)
    accessibility_score = Column(Float, default=0.5)

    city = relationship("City", back_populates="cells")
    scores = relationship("CellScore", back_populates="cell", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_h3_cells_city", "city_id"),
        Index("idx_h3_cells_coords", "lat", "lon"),
    )


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(50), primary_key=True)
    city_id = Column(String(50), ForeignKey("cities.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    travel_minutes = Column(Integer, default=10)
    h3_res = Column(Integer, default=8)
    params = Column(JSON, default=dict)
    status = Column(String(50), default="COMPLETED") # RUNNING, COMPLETED, FAILED

    city = relationship("City", back_populates="runs")
    cell_scores = relationship("CellScore", back_populates="run", cascade="all, delete-orphan")
    candidates = relationship("CandidateSite", back_populates="run", cascade="all, delete-orphan")
    scenarios = relationship("Scenario", back_populates="run", cascade="all, delete-orphan")


class CellScore(Base):
    __tablename__ = "cell_scores"

    id = Column(String(100), primary_key=True) # f"{run_id}_{cell_id}"
    cell_id = Column(String(25), ForeignKey("h3_cells.h3_index"), nullable=False)
    run_id = Column(String(50), ForeignKey("analysis_runs.id"), nullable=False)
    supply_score = Column(Float, default=0.0)
    demand_score = Column(Float, default=0.0)
    feasibility_score = Column(Float, default=0.0)
    gap_score = Column(Float, default=0.0)
    nearest_charger_m = Column(Float, default=9999.0)
    nearest_charger_min = Column(Float, default=99.0)
    chargers_in_reach = Column(Integer, default=0)

    cell = relationship("H3Cell", back_populates="scores")
    run = relationship("AnalysisRun", back_populates="cell_scores")

    __table_args__ = (
        Index("idx_cell_scores_run", "run_id"),
        Index("idx_cell_scores_gap", "gap_score"),
    )


class CandidateSite(Base):
    __tablename__ = "candidate_sites"

    id = Column(String(50), primary_key=True)
    run_id = Column(String(50), ForeignKey("analysis_runs.id"), nullable=False)
    cluster_id = Column(Integer, nullable=True)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    name = Column(String(200), nullable=False)
    zone = Column(String(100), nullable=True)
    topsis_score = Column(Float, default=0.0)
    rank = Column(Integer, default=0)
    est_daily_sessions = Column(Float, default=8.0)
    est_cost_inr = Column(Float, default=1500000.0)
    payback_years = Column(Float, default=3.2)
    criteria_breakdown = Column(JSON, default=dict)

    run = relationship("AnalysisRun", back_populates="candidates")

    __table_args__ = (
        Index("idx_candidates_run", "run_id"),
        Index("idx_candidates_rank", "rank"),
    )


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(String(50), primary_key=True)
    run_id = Column(String(50), ForeignKey("analysis_runs.id"), nullable=False)
    name = Column(String(150), nullable=False)
    budget_inr = Column(Float, nullable=False)
    n_sites = Column(Integer, nullable=False)
    charger_type = Column(String(50), default="DC_FAST_60KW")
    selected_site_ids = Column(JSON, default=list) # List of candidate_site IDs
    coverage_before = Column(Float, default=0.0)
    coverage_after = Column(Float, default=0.0)
    total_cost_inr = Column(Float, default=0.0)
    avg_payback_years = Column(Float, default=0.0)
    curve = Column(JSON, default=list) # [{"budget": ..., "coverage": ...}]
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("AnalysisRun", back_populates="scenarios")

    __table_args__ = (
        Index("idx_scenarios_run", "run_id"),
    )
