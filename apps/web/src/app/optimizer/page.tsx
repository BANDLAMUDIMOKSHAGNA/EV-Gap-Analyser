"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchCells, fetchChargers } from "@/lib/api";
import MapView from "@/components/map/MapView";
import { formatINR } from "@/lib/formatters";
import {
  Calculator,
  DollarSign,
  Zap,
  TrendingUp,
  CheckCircle2,
  BookmarkPlus,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BudgetOptimizerPage() {
  const [budgetINR, setBudgetINR] = useState<number>(3500000); // ₹35 Lakh default
  const [stationCount, setStationCount] = useState<number>(3);
  const [chargerType, setChargerType] = useState<string>("DC_FAST_60KW");
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [scenarioName, setScenarioName] = useState<string>("Municipal Priority Scenario");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Queries
  const { data: cellsData } = useQuery({
    queryKey: ["cells", "vizag"],
    queryFn: () => fetchCells("vizag"),
  });

  const { data: chargersData } = useQuery({
    queryKey: ["chargers", "vizag"],
    queryFn: () => fetchChargers("vizag"),
  });

  // Optimisation Mutation
  const optimizeMutation = useMutation({
    mutationFn: async (params: { budget: number; nSites: number; type: string }) => {
      const runsRes = await fetch(`${API_BASE}/api/v1/runs?city_id=vizag`);
      const runs = await runsRes.json();
      const runId = runs[0]?.id;
      if (!runId) throw new Error("No run found");

      const res = await fetch(`${API_BASE}/api/v1/runs/${runId}/optimise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget_inr: params.budget,
          n_sites: params.nSites,
          charger_type: params.type,
        }),
      });
      if (!res.ok) throw new Error("Optimisation failed");
      return res.json();
    },
    onSuccess: () => {
      setToastMessage("Optimal site portfolio solved via Google OR-Tools CP-SAT");
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Save Scenario Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const opt = optimizeMutation.data;
      if (!opt) return;

      const res = await fetch(`${API_BASE}/api/v1/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: opt.run_id,
          name: scenarioName,
          budget_inr: opt.budget_inr,
          n_sites: opt.n_sites,
          charger_type: opt.charger_type,
          selected_site_ids: opt.selected_site_ids,
          coverage_before: opt.coverage_before,
          coverage_after: opt.coverage_after,
          total_cost_inr: opt.total_cost_inr,
          avg_payback_years: opt.avg_payback_years,
          curve: opt.curve,
        }),
      });
      if (!res.ok) throw new Error("Failed to save scenario");
      return res.json();
    },
    onSuccess: () => {
      setShowSaveModal(false);
      setToastMessage("Scenario saved to database!");
      setTimeout(() => setToastMessage(null), 3000);
    },
  });

  // Run on load
  useEffect(() => {
    optimizeMutation.mutate({
      budget: budgetINR,
      nSites: stationCount,
      type: chargerType,
    });
  }, []);

  const handleSolve = () => {
    optimizeMutation.mutate({
      budget: budgetINR,
      nSites: stationCount,
      type: chargerType,
    });
  };

  const optData = optimizeMutation.data;
  const coverageBarData = [
    { name: "Existing Chargers", coverage: optData?.coverage_before || 27.1 },
    { name: "With Selected Sites", coverage: optData?.coverage_after || 48.5 },
  ];

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-text text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-border space-y-4">
            <h3 className="text-base font-bold text-neutral-text">Save Optimisation Scenario</h3>
            <p className="text-xs text-neutral-secondary">
              Store this candidate portfolio for city planning committee review and report generation.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-text">Scenario Name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 text-xs text-neutral-secondary space-y-1">
              <div className="flex justify-between">
                <span>Total CapEx:</span>
                <strong className="text-neutral-text">{formatINR(optData?.total_cost_inr || 0)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Coverage Delta:</span>
                <strong className="text-emerald-700">
                  {optData?.coverage_before}% &rarr; {optData?.coverage_after}%
                </strong>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-neutral-secondary hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
              >
                {saveMutation.isPending ? "Saving..." : "Save Scenario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Floating Parameter & KPI Drawer */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-neutral-border shadow-xl space-y-4 w-80 sm:w-96 text-xs max-h-[calc(100vh-5.5rem)] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2 font-bold text-neutral-text text-sm">
            <Calculator className="w-4 h-4 text-primary" />
            <span>Budget & Coverage Optimiser</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {optData?.solver_status || "CP-SAT"}
          </span>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          {/* Budget Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-text">CapEx Budget:</span>
              <span className="tabular-nums font-bold text-primary text-sm">
                {formatINR(budgetINR)}
              </span>
            </div>
            <input
              type="range"
              min={1000000} // 10L
              max={30000000} // 3 Cr
              step={500000}
              value={budgetINR}
              onChange={(e) => setBudgetINR(parseInt(e.target.value))}
              className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-secondary">
              <span>₹10 Lakh</span>
              <span>₹3 Crore</span>
            </div>
          </div>

          {/* Site Stepper */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-neutral-text">Max Stations to Build:</span>
              <span className="tabular-nums font-bold text-neutral-text text-sm">
                {stationCount} Stations
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 5, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setStationCount(n)}
                  className={`flex-1 py-1 rounded-md font-semibold text-xs border transition-all ${
                    stationCount === n
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-slate-50 text-neutral-secondary border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Charger Hardware */}
          <div className="space-y-1">
            <label className="font-semibold text-neutral-text block">Hardware Tier:</label>
            <select
              value={chargerType}
              onChange={(e) => setChargerType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-medium focus:ring-primary"
            >
              <option value="DC_FAST_60KW">Dual Gun 60kW DC Fast (CCS2) - ₹8.5L</option>
              <option value="AC_DUAL_22KW">Dual Gun 22kW AC Type 2 - ₹1.8L</option>
            </select>
          </div>

          <button
            onClick={handleSolve}
            disabled={optimizeMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{optimizeMutation.isPending ? "Solving..." : "Run CP-SAT Optimiser"}</span>
          </button>
        </div>

        {/* Solved KPIs */}
        {optData && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-neutral-text text-xs uppercase tracking-wider">
              Optimization Results
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block">Coverage Gain</span>
                <p className="text-base font-bold text-emerald-950 tabular-nums">
                  {optData.coverage_before}% &rarr; {optData.coverage_after}%
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  +{(optData.coverage_after - optData.coverage_before).toFixed(1)}% City Area
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-neutral-secondary block">Total CapEx</span>
                <p className="text-base font-bold text-neutral-text tabular-nums">
                  {formatINR(optData.total_cost_inr)}
                </p>
                <span className="text-[10px] text-neutral-secondary">
                  Payback: {optData.avg_payback_years} yrs
                </span>
              </div>
            </div>

            {/* Before vs After Coverage Bar Chart */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-neutral-secondary">
                5-Min Drive Catchment Coverage:
              </span>
              <div className="h-28 w-full bg-slate-50 p-2 rounded-lg border border-slate-200">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coverageBarData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(val: any) => [`${val}%`, "Coverage"]} />
                    <Bar dataKey="coverage" fill="#0F9D74" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pareto Curve Mini */}
            {optData.curve && optData.curve.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-neutral-secondary">
                  Budget vs Coverage Curve (Pareto Frontier):
                </span>
                <div className="h-28 w-full bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={optData.curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="budget" tickFormatter={(v) => `₹${v/100000}L`} tick={{ fontSize: 9 }} />
                      <YAxis domain={[20, 100]} tick={{ fontSize: 9 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, "Coverage"]}
                        labelFormatter={(v) => `Budget: ${formatINR(Number(v))}`}
                      />
                      <Line type="monotone" dataKey="coverage" stroke="#2563EB" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowSaveModal(true)}
              className="w-full py-2 rounded-lg border border-primary text-primary hover:bg-primary/5 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save Scenario for Planning Report</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Map with Selected Candidate Sites */}
      <div className="flex-1 w-full h-full">
        <MapView
          cells={cellsData}
          chargers={chargersData}
          candidateSites={optData?.selected_sites}
          activeMetric="gap_score"
        />
      </div>
    </div>
  );
}
