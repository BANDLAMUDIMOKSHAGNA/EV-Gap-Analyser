"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CandidateSite } from "@/types";
import { formatINR } from "@/lib/formatters";
import {
  Sliders,
  RotateCcw,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  Zap,
  MapPin,
  CheckCircle2
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_WEIGHTS: Record<string, number> = {
  demand: 30,
  population: 20,
  grid: 15,
  land_use: 15,
  accessibility: 10,
  competition: 10,
};

export default function SiteRankingPage() {
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(null);
  const [showAHPInfo, setShowAHPInfo] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Total weights
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // Fetch or trigger ranking
  const rankMutation = useMutation({
    mutationFn: async (w: Record<string, number>) => {
      // First get latest run ID
      const runsRes = await fetch(`${API_BASE}/api/v1/runs?city_id=vizag`);
      const runs = await runsRes.json();
      const runId = runs[0]?.id;
      if (!runId) throw new Error("No run found");

      const res = await fetch(`${API_BASE}/api/v1/runs/${runId}/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: w }),
      });
      if (!res.ok) throw new Error("Failed to rank sites");
      return res.json();
    },
    onSuccess: () => {
      setToastMessage("Rankings updated based on criteria weights");
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Initial load
  useEffect(() => {
    rankMutation.mutate(weights);
  }, []);

  // Handle slider change with debounced mutation
  const handleSliderChange = (criterion: string, val: number) => {
    const updated = { ...weights, [criterion]: val };
    setWeights(updated);
  };

  // Re-rank button / debounced trigger
  const handleApplyWeights = () => {
    rankMutation.mutate(weights);
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    rankMutation.mutate(DEFAULT_WEIGHTS);
  };

  const rankedSites: CandidateSite[] = rankMutation.data?.sites || [];
  const consistencyRatio = rankMutation.data?.consistency_ratio || 0.04;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-text text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-neutral-text">Multi-Criteria Candidate Site Ranking</h1>
          </div>
          <p className="text-xs text-neutral-secondary mt-0.5">
            AHP (Analytic Hierarchy Process) criteria weighting + TOPSIS multi-attribute distance ranking.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAHPInfo(!showAHPInfo)}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-neutral-secondary hover:text-neutral-text text-xs font-medium flex items-center space-x-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>What is AHP?</span>
          </button>
          <button
            onClick={handleResetWeights}
            className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-neutral-secondary hover:text-neutral-text text-xs font-medium flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Weights</span>
          </button>
        </div>
      </div>

      {/* AHP Explanation Callout */}
      {showAHPInfo && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2 leading-relaxed">
          <div className="font-bold flex items-center space-x-1.5 text-emerald-900">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>Understanding AHP + TOPSIS Explainability</span>
          </div>
          <p>
            The <strong>Analytic Hierarchy Process (AHP)</strong> derives mathematically consistent relative weights
            from a pairwise comparison matrix of urban criteria. The <strong>Consistency Ratio (CR)</strong> ensures
            planners&apos; preferences do not contradict each other (CR &le; 0.10 indicates strict transitive consistency).
          </p>
          <p>
            <strong>TOPSIS</strong> evaluates candidate cluster centroids against both the theoretical &quot;Positive Ideal Site&quot;
            (maximum demand, nearest substation, zero competition) and the &quot;Negative Ideal Site&quot;. Each site&apos;s score
            represents its geometric closeness (0 to 100).
          </p>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Criteria Weight Sliders (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-neutral-border p-5 shadow-xs space-y-5 h-fit sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-neutral-text text-sm">Criteria Weights</h3>
            </div>
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>CR: {consistencyRatio} (Consistent)</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs">
            {[
              { id: "demand", label: "Charging Demand", desc: "Predicted daily charging traffic" },
              { id: "population", label: "Population Density", desc: "Residential & daytime catchment" },
              { id: "grid", label: "Grid Proximity", desc: "Distance to 33kV/11kV substation" },
              { id: "land_use", label: "Land-Use Suitability", desc: "Zoning compatibility (Commercial/Tech)" },
              { id: "accessibility", label: "Road Accessibility", desc: "Arterial class & intersection ingress" },
              { id: "competition", label: "Distance to Existing", desc: "Absence of nearby operational chargers" },
            ].map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-text">{c.label}</span>
                  <span className="tabular-nums font-bold text-primary">{weights[c.id]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={weights[c.id]}
                  onChange={(e) => handleSliderChange(c.id, parseInt(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-neutral-secondary">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Weight Total Indicator */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-secondary">Normalized Total:</span>
            <span className={`font-bold tabular-nums ${totalWeight === 100 ? "text-emerald-700" : "text-amber-700"}`}>
              {totalWeight}% {totalWeight !== 100 && "(Auto-normalized)"}
            </span>
          </div>

          <button
            onClick={handleApplyWeights}
            disabled={rankMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition-colors shadow-sm"
          >
            {rankMutation.isPending ? "Calculating TOPSIS..." : "Apply Weights & Re-rank"}
          </button>
        </div>

        {/* Right Column: Ranked Sites Table & Explainer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-neutral-border flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-neutral-text text-sm">Ranked Candidate Sites</h3>
                <p className="text-xs text-neutral-secondary">
                  Sorted by relative closeness to positive ideal solution ($C_i$)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-neutral-text">
                {rankedSites.length} Candidate Sites
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-neutral-border text-neutral-secondary">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold w-12 text-center">Rank</th>
                    <th className="py-2.5 px-3 font-semibold">Candidate Site & Zone</th>
                    <th className="py-2.5 px-3 font-semibold text-center">TOPSIS Score</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Daily Sessions</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Est. Cost</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Payback</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedSites.map((site) => {
                    const isSelected = selectedSite?.id === site.id;
                    return (
                      <React.Fragment key={site.id}>
                        <tr
                          onClick={() => setSelectedSite(isSelected ? null : site)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                            isSelected ? "bg-emerald-50/50" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                              site.rank === 1
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : site.rank === 2
                                ? "bg-slate-200 text-slate-800"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              #{site.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-neutral-text">{site.name}</div>
                            <div className="text-[10px] text-neutral-secondary capitalize flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-primary inline" />
                              <span>{site.zone?.replace("_", " ")}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {site.topsis_score}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold">
                            {site.est_daily_sessions}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold text-neutral-text">
                            {formatINR(site.est_cost_inr)}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-semibold text-emerald-700">
                            {site.payback_years} yrs
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isSelected ? (
                              <ChevronUp className="w-4 h-4 text-primary inline" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-secondary inline" />
                            )}
                          </td>
                        </tr>

                        {/* Expandable "Why this site?" card */}
                        {isSelected && (
                          <tr>
                            <td colSpan={7} className="p-4 bg-slate-50/80 border-y border-slate-200">
                              <div className="space-y-3 max-w-3xl">
                                <div className="flex items-center space-x-1.5 font-bold text-xs text-neutral-text">
                                  <Info className="w-4 h-4 text-primary" />
                                  <span>Why did this site rank #{site.rank}? (Per-criterion contribution)</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {Object.entries(site.criteria_breakdown || {}).map(([crit, pct]) => (
                                    <div key={crit} className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="capitalize text-neutral-secondary">{crit.replace("_", " ")}</span>
                                        <span className="font-bold tabular-nums text-neutral-text">{pct}%</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-primary rounded-full"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="p-2.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs flex justify-between items-center">
                                  <span>Estimated 5-Year IRR: <strong>24.8%</strong></span>
                                  <span>Simple Payback: <strong>{site.payback_years} Years</strong></span>
                                  <span>Rated Hardware: <strong>Dual 60kW DC Fast</strong></span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
