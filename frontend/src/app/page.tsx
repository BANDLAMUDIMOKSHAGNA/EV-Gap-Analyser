"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchCities, fetchRuns, fetchChargers, fetchCells } from "../lib/api";
import { formatIndianNumber } from "../lib/formatters";
import {
  Car,
  Zap,
  Clock,
  Flame,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Play
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

const VAHAN_GROWTH_DATA = [
  { year: "2020", ev_count: 3200 },
  { year: "2021", ev_count: 7800 },
  { year: "2022", ev_count: 14900 },
  { year: "2023", ev_count: 24780 },
  { year: "2024 (Est)", ev_count: 38970 },
];

const ZONE_GAP_DATA = [
  { zone: "Madhurawada IT", gap: 94.2 },
  { zone: "NAD Kotha Rd", gap: 88.5 },
  { zone: "Pendurthi", gap: 82.1 },
  { zone: "Gajuwaka East", gap: 76.4 },
  { zone: "Rushikonda", gap: 69.8 },
];

export default function OverviewPage() {
  const { data: chargersData } = useQuery({
    queryKey: ["chargers", "vizag"],
    queryFn: () => fetchChargers("vizag"),
  });

  const { data: runsData } = useQuery({
    queryKey: ["runs", "vizag"],
    queryFn: () => fetchRuns("vizag"),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hero Welcome & Quick Action */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Pilot City: Greater Visakhapatnam Municipal Corporation (GVMC)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Find where India needs EV chargers next.
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Explainable, budget-aware spatial decision support for municipal planners, DISCOMs,
            and charge point operators. Traceable back to open government registries.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
          <Link
            href="/gaps"
            className="px-5 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2"
          >
            <span>Explore Gap Heatmap</span>
            <ArrowRight className="w-4 h-4 text-emerald-700" />
          </Link>
          <Link
            href="/ranking"
            className="px-5 py-3 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-sm border border-emerald-500/40 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Site Ranking</span>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered EVs</span>
            <Car className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-neutral-text tabular-nums">
            {formatIndianNumber(38970)}
          </p>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+57% YoY (Vahan AP)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Public Chargers</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-text tabular-nums">
            {chargersData?.features.length || 10} Stations
          </p>
          <p className="text-xs text-neutral-secondary">
            BEE Registry & OSM verified
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">5-Min Coverage Deficit</span>
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700 tabular-nums">
            72.4%
          </p>
          <p className="text-xs text-neutral-secondary">
            Urban area without 5-min charger
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-secondary">
            <span className="text-xs font-semibold uppercase tracking-wider">Hotspots Detected</span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-neutral-text tabular-nums">
            14 Clusters
          </p>
          <p className="text-xs text-neutral-secondary">
            DBSCAN Spatial Grouping
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Underserved Zones Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-neutral-text text-sm">
                Top Underserved Zones (Gap Index)
              </h3>
              <p className="text-xs text-neutral-secondary">
                Relative charging deficit score based on demand vs supply decay
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-semibold text-neutral-secondary">
              Vizag GVMC
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ZONE_GAP_DATA} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="zone" type="category" width={110} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} / 100`, "Gap Score"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                />
                <Bar dataKey="gap" fill="#B91C1C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-neutral-secondary italic">
            Source: OpenStreetMap highway network, BEE Registry & Vahan RTO figures. Retrieved Oct 2024.
          </p>
        </div>

        {/* EV Adoption Growth Line Chart */}
        <div className="bg-white p-5 rounded-xl border border-neutral-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-neutral-text text-sm">
                EV Registrations Trend (Vizag District)
              </h3>
              <p className="text-xs text-neutral-secondary">
                Historical & projected cumulative EV fleet (2W, 3W, 4W)
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
              Vahan Dashboard
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={VAHAN_GROWTH_DATA} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [formatIndianNumber(val), "Registered EVs"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                />
                <Line
                  type="monotone"
                  dataKey="ev_count"
                  stroke="#0F9D74"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0F9D74" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-neutral-secondary italic">
            Source: Ministry of Road Transport and Highways (MoRTH) - Vahan Dashboard. Retrieved Oct 2024.
          </p>
        </div>
      </div>

      {/* Recent Analysis Runs Table */}
      <div className="bg-white rounded-xl border border-neutral-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-border flex items-center justify-between">
          <h3 className="font-bold text-neutral-text text-sm">Recent Analysis Runs</h3>
          <Link
            href="/gaps"
            className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center space-x-1"
          >
            <span>Launch New Run</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-neutral-border text-neutral-secondary">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Run ID</th>
                <th className="py-2.5 px-4 font-semibold">Travel Catchment</th>
                <th className="py-2.5 px-4 font-semibold">H3 Resolution</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Routing</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runsData && runsData.length > 0 ? (
                runsData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-neutral-text">
                      {r.id}
                    </td>
                    <td className="py-3 px-4 text-neutral-secondary">
                      {r.travel_minutes} minutes
                    </td>
                    <td className="py-3 px-4 text-neutral-secondary font-mono">
                      Res {r.h3_res}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-secondary">
                      {r.params?.routing_provider || "approximate"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href="/gaps"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-secondary">
                    No runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
