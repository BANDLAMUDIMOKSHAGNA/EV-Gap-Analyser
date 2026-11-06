"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatINR, formatDate } from "@/lib/formatters";
import { Scenario, AnalysisRun } from "@/types";
import {
  FileText,
  Download,
  Share2,
  Bookmark,
  Calendar,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  ExternalLink
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: scenarios, isLoading: scenLoading } = useQuery<Scenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/scenarios`);
      if (!res.ok) throw new Error("Failed to load scenarios");
      return res.json();
    },
  });

  const { data: runs, isLoading: runsLoading } = useQuery<AnalysisRun[]>({
    queryKey: ["runs", "vizag"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/runs?city_id=vizag`);
      if (!res.ok) throw new Error("Failed to load runs");
      return res.json();
    },
  });

  const filteredScenarios = scenarios?.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-neutral-text">Planning Reports & Saved Scenarios</h1>
          </div>
          <p className="text-xs text-neutral-secondary mt-0.5">
            Download executive feasibility reports, export spatial GeoJSON, and compare budget scenarios.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-secondary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search saved scenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-primary focus:outline-hidden"
          />
        </div>
      </div>

      {/* Saved Scenarios Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-text">Saved Optimization Portfolios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScenarios?.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-neutral-border p-5 shadow-xs space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-secondary uppercase">
                    ID: {s.id.slice(0, 15)}
                  </span>
                  <h4 className="font-bold text-neutral-text text-sm mt-0.5">{s.name}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {s.selected_site_ids?.length || s.n_sites} Sites
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-neutral-secondary block">Total CapEx</span>
                  <strong className="text-neutral-text tabular-nums text-sm">
                    {formatINR(s.total_cost_inr)}
                  </strong>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 block">Coverage Gain</span>
                  <strong className="text-emerald-950 tabular-nums text-sm">
                    {s.coverage_before}% &rarr; {s.coverage_after}%
                  </strong>
                </div>
              </div>

              <div className="text-[11px] text-neutral-secondary flex justify-between items-center pt-1 border-t border-slate-100">
                <span>Avg Payback: <strong className="text-neutral-text">{s.avg_payback_years} Yrs</strong></span>
                <span>{formatDate(s.created_at)}</span>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <a
                  href={`${API_BASE}/api/v1/export/${s.run_id}?format=geojson`}
                  className="flex-1 py-1.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-neutral-text font-semibold text-xs text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>GeoJSON</span>
                </a>
                <a
                  href={`${API_BASE}/api/v1/export/${s.run_id}?format=csv`}
                  className="flex-1 py-1.5 px-3 rounded-md bg-slate-100 hover:bg-slate-200 text-neutral-text font-semibold text-xs text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Runs Export Table */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-xs overflow-hidden space-y-2">
        <div className="p-4 border-b border-neutral-border bg-slate-50">
          <h3 className="font-bold text-neutral-text text-sm">Raw Spatial Analysis Exports</h3>
          <p className="text-xs text-neutral-secondary">
            Download full hexagon grid with supply, demand, feasibility, and gap scores.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-neutral-secondary border-b border-neutral-border">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Run ID</th>
                <th className="py-2.5 px-4 font-semibold">City</th>
                <th className="py-2.5 px-4 font-semibold">Travel Threshold</th>
                <th className="py-2.5 px-4 font-semibold">Hexagons Scored</th>
                <th className="py-2.5 px-4 font-semibold text-right">Direct Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-medium text-neutral-text">{r.id}</td>
                  <td className="py-3 px-4 text-neutral-text font-semibold">Visakhapatnam</td>
                  <td className="py-3 px-4 text-neutral-secondary">{r.travel_minutes} minutes</td>
                  <td className="py-3 px-4 font-mono">{r.scored_cells_count || 738} cells</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <a
                      href={`${API_BASE}/api/v1/export/${r.id}?format=csv`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-neutral-text font-medium"
                    >
                      <Download className="w-3 h-3" />
                      <span>CSV</span>
                    </a>
                    <a
                      href={`${API_BASE}/api/v1/export/${r.id}?format=geojson`}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-neutral-text font-medium"
                    >
                      <Download className="w-3 h-3" />
                      <span>GeoJSON</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
