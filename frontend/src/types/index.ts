export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  default_h3_res: number;
  lat_center: number;
  lon_center: number;
  boundary_geojson: {
    type: string;
    coordinates: number[][][];
  };
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  url?: string;
  retrieved_at?: string;
  licence: string;
  is_demo: boolean;
  description?: string;
}

export interface ChargerProperties {
  id: string;
  name: string;
  operator?: string;
  connector_types: string[];
  power_kw: number;
  charger_type: string;
  status: string;
  source?: string;
  updated_at?: string;
}

export interface ChargerFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: ChargerProperties;
}

export interface ChargerFeatureCollection {
  type: "FeatureCollection";
  data_mode: string;
  features: ChargerFeature[];
}

export interface CellProperties {
  h3_index: string;
  supply_score: number;
  demand_score: number;
  feasibility_score: number;
  gap_score: number;
  nearest_charger_m: number;
  nearest_charger_min: number;
  chargers_in_reach: number;
  population: number;
  ev_count: number;
  road_density: number;
  land_use: string;
  dist_substation_m: number;
  accessibility_score: number;
}

export interface CellFeature {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [[[lon, lat], ...]]
  };
  properties: CellProperties;
}

export interface CellFeatureCollection {
  type: "FeatureCollection";
  run_id: string;
  data_mode: string;
  routing_mode: string;
  features: CellFeature[];
}

export interface AnalysisRun {
  id: string;
  city_id: string;
  created_at: string;
  travel_minutes: number;
  h3_res: number;
  status: string;
  params: Record<string, any>;
  scored_cells_count: number;
}

export interface CandidateSite {
  id: string;
  run_id: string;
  cluster_id?: number;
  lat: number;
  lon: number;
  name: string;
  zone?: string;
  topsis_score: number;
  rank: number;
  est_daily_sessions: number;
  est_cost_inr: number;
  payback_years: number;
  criteria_breakdown: Record<string, number>;
}

export interface Scenario {
  id: string;
  run_id: string;
  name: string;
  budget_inr: number;
  n_sites: number;
  charger_type: string;
  selected_site_ids: string[];
  coverage_before: number;
  coverage_after: number;
  total_cost_inr: number;
  avg_payback_years: number;
  curve: Array<{ budget: number; coverage: number }>;
  created_at: string;
}
