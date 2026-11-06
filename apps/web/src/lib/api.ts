import {
  City,
  Dataset,
  ChargerFeatureCollection,
  CellFeatureCollection,
  AnalysisRun,
  CandidateSite,
  Scenario
} from "@/types";

/**
 * Resolves the target API URL for an endpoint path.
 *
 * - In browser: returns a relative URL path (e.g. `/api/v1/cities`) or prefixed by NEXT_PUBLIC_API_URL.
 *   In Vercel multi-service routing, top-level rewrites forward `/api/(.*)` directly to the backend service.
 * - On server (Next.js SSR / Server Components / Route Handlers):
 *   Uses `process.env.API_URL` injected by Vercel's internal service binding (e.g. `new URL(...)`).
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined") {
    const base = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") : "";
    return `${base}${cleanPath}`;
  }

  // Server-side: read bound internal service URL
  const serviceBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  try {
    return new URL(cleanPath.replace(/^\//, ""), serviceBase.endsWith("/") ? serviceBase : `${serviceBase}/`).toString();
  } catch {
    return `${serviceBase.replace(/\/$/, "")}${cleanPath}`;
  }
}

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "") : "";
  }
  if (process.env.API_URL) {
    return process.env.API_URL.replace(/\/$/, "");
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export const API_BASE = getApiBase();

export async function fetchCities(): Promise<City[]> {
  const res = await fetch(getApiUrl("/api/v1/cities"));
  if (!res.ok) throw new Error("Failed to fetch cities");
  return res.json();
}

export async function fetchDatasets(): Promise<Dataset[]> {
  const res = await fetch(getApiUrl("/api/v1/datasets"));
  if (!res.ok) throw new Error("Failed to fetch datasets");
  return res.json();
}

export async function fetchChargers(
  cityId: string = "vizag",
  filters?: { type?: string; operator?: string; status?: string }
): Promise<ChargerFeatureCollection> {
  const params = new URLSearchParams();
  if (filters?.type) params.set("charger_type", filters.type);
  if (filters?.operator) params.set("operator", filters.operator);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString();
  const path = query ? `/api/v1/cities/${cityId}/chargers?${query}` : `/api/v1/cities/${cityId}/chargers`;
  const res = await fetch(getApiUrl(path));
  if (!res.ok) throw new Error("Failed to fetch chargers");
  return res.json();
}

export async function fetchCells(
  cityId: string = "vizag",
  runId?: string
): Promise<CellFeatureCollection> {
  const path = runId
    ? `/api/v1/cities/${cityId}/cells?run_id=${runId}`
    : `/api/v1/cities/${cityId}/cells`;
  const res = await fetch(getApiUrl(path));
  if (!res.ok) throw new Error("Failed to fetch cells");
  return res.json();
}

export async function fetchRuns(cityId: string = "vizag"): Promise<AnalysisRun[]> {
  const res = await fetch(getApiUrl(`/api/v1/runs?city_id=${cityId}`));
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function triggerRun(params: {
  city_id: string;
  travel_minutes: number;
  h3_res: number;
}): Promise<AnalysisRun> {
  const res = await fetch(getApiUrl("/api/v1/runs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to start analysis run");
  return res.json();
}
