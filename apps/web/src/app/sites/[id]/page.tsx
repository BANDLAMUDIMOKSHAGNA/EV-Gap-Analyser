"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api";
import { formatINR } from "@/lib/formatters";
import {
  FileText,
  Download,
  Share2,
  Printer,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Zap,
  Calendar,
  AlertTriangle
} from "lucide-react";

export default function SiteReportPage() {
  const params = useParams();
  const siteId = params?.id as string;

  const { data: report, isLoading } = useQuery({
    queryKey: ["site-report", siteId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/api/v1/sites/${siteId}/report`));
      if (!res.ok) throw new Error("Failed to load site report");
      return res.json();
    },
    enabled: !!siteId,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-neutral-secondary text-sm">
        Loading site feasibility report...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-12 text-center text-neutral-secondary text-sm">
        Report not found for candidate site: {siteId}
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8 bg-white min-h-screen border border-neutral-border my-6 rounded-2xl shadow-sm print:border-none print:shadow-none print:m-0 print:p-0">
      {/* Top Action Bar (Hidden when printed) */}
      <div className="flex items-center justify-between border-b border-neutral-border pb-4 print:hidden">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-primary" />
          <span className="font-bold text-neutral-text text-sm">Executive Site Feasibility Report</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-neutral-secondary hover:bg-slate-50 flex items-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-neutral-secondary hover:bg-slate-50 flex items-center space-x-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <a
            href={getApiUrl(`/api/v1/sites/${siteId}/report.pdf`)}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official PDF</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            TOPSIS Rank #{report.rank}
          </span>
          <span className="text-xs text-neutral-secondary">
            Candidate ID: {report.site_id}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-text">
          {report.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-secondary pt-1">
          <span className="flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Coordinates: {report.coordinates?.lat?.toFixed(5)}°N, {report.coordinates?.lon?.toFixed(5)}°E</span>
          </span>
          <span className="flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Urban Zone: {report.zone}</span>
          </span>
        </div>
      </div>

      {/* CapEx & Financial Summary Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-neutral-text">1. Capital Expenditure & Financial Model</h3>
        <div className="border border-neutral-border rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-neutral-secondary border-b border-neutral-border">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Financial Component</th>
                <th className="py-2.5 px-4 font-semibold">Value / Metric</th>
                <th className="py-2.5 px-4 font-semibold">Model Assumption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-neutral-text">Total Estimated CapEx</td>
                <td className="py-3 px-4 font-bold text-primary tabular-nums">
                  {formatINR(report.financials?.est_cost_inr)}
                </td>
                <td className="py-3 px-4 text-neutral-secondary">Hardware (Dual 60kW DC) + Civil + Grid connection</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-neutral-text">Daily Charging Traffic</td>
                <td className="py-3 px-4 font-bold text-neutral-text tabular-nums">
                  {report.financials?.est_daily_sessions} sessions / day
                </td>
                <td className="py-3 px-4 text-neutral-secondary">Calibrated from high-gap demand regressor</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-neutral-text">Projected Annual Revenue</td>
                <td className="py-3 px-4 font-bold text-neutral-text tabular-nums">
                  {formatINR(report.financials?.annual_revenue_projection_inr)}
                </td>
                <td className="py-3 px-4 text-neutral-secondary">₹16.50/kWh customer tariff - ₹7.20 APERC power cost</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-neutral-text">Simple Payback Period</td>
                <td className="py-3 px-4 font-bold text-emerald-700 tabular-nums">
                  {report.financials?.payback_years} Years
                </td>
                <td className="py-3 px-4 text-neutral-secondary">Includes 8% annual O&M + commercial lease rent</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Criteria Contribution Breakdown */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-neutral-text">2. Multi-Criteria Explainability (Why this site?)</h3>
        <p className="text-xs text-neutral-secondary">
          TOPSIS score decomposition showing exact per-criterion separation contributions.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(report.criteria_breakdown || {}).map(([crit, pct]) => (
            <div key={crit} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
              <span className="capitalize font-semibold text-neutral-secondary">{crit.replace("_", " ")}</span>
              <p className="text-lg font-bold text-neutral-text tabular-nums">{pct as any}%</p>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions and Provenance */}
      <div className="space-y-3 pt-4 border-t border-slate-200 text-xs">
        <h3 className="text-sm font-bold text-neutral-text">3. Traceability & Model Disclaimers</h3>
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1 leading-relaxed">
          <div className="flex items-center space-x-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Assumptions & Risk Factors:</span>
          </div>
          <p>
            {report.financials?.assumptions}. All projections are generated under <strong>DATA_MODE=demo</strong>.
            Before capital deployment, physical site survey by GVMC engineers and formal grid connection sanction
            from APEPDCL are required.
          </p>
        </div>

        <div className="space-y-1 text-neutral-secondary text-[11px]">
          <p className="font-semibold text-neutral-text">Registered Data Sources:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {report.datasets_provenance?.map((ds: any) => (
              <li key={ds.id}>
                <strong>{ds.name}</strong> — {ds.source} ({ds.licence})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
