"use client";

import React from "react";
import { CellProperties } from "../../types";
import { X, BatteryCharging, Users, Car, Zap, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { formatDistanceKm, formatMinutes, formatIndianNumber } from "../../lib/formatters";

interface CellDrawerProps {
  cell: CellProperties | null;
  onClose: () => void;
  onPromoteCandidate?: (cell: CellProperties) => void;
}

export default function CellDrawer({ cell, onClose, onPromoteCandidate }: CellDrawerProps) {
  if (!cell) return null;

  const gapColor =
    cell.gap_score >= 70
      ? "bg-red-100 text-red-800 border-red-300"
      : cell.gap_score >= 40
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-teal-100 text-teal-800 border-teal-300";

  return (
    <div className="absolute top-0 right-0 h-full w-80 sm:w-96 bg-white border-l border-neutral-border shadow-xl z-30 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="p-4 border-b border-neutral-border flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${gapColor}`}>
                Gap Score: {cell.gap_score} / 100
              </span>
            </div>
            <h3 className="font-bold text-neutral-text text-sm mt-1 flex items-center space-x-1.5">
              <span>H3 Hexagon</span>
              <span className="font-mono text-xs text-neutral-secondary">
                #{cell.h3_index.slice(-6)}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-secondary mt-0.5">
              Higher gap score indicates greater unmet charging demand.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-scores breakdown */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-text uppercase tracking-wider">
              Component Scores
            </h4>

            {/* Demand Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-secondary">Demand Score</span>
                <span className="tabular-nums font-semibold">{cell.demand_score} / 100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${cell.demand_score}%` }}
                />
              </div>
            </div>

            {/* Supply Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-secondary">Supply Score</span>
                <span className="tabular-nums font-semibold">{cell.supply_score} / 100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all"
                  style={{ width: `${cell.supply_score}%` }}
                />
              </div>
            </div>

            {/* Feasibility Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-neutral-secondary">Feasibility Score</span>
                <span className="tabular-nums font-semibold">{cell.feasibility_score} / 100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${cell.feasibility_score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Infrastructure Metrics */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-semibold text-neutral-text uppercase tracking-wider">
              Catchment & Proximity
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-1.5 text-neutral-secondary mb-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-primary" />
                  <span>Nearest Charger</span>
                </div>
                <p className="font-bold text-neutral-text tabular-nums text-sm">
                  {formatDistanceKm(cell.nearest_charger_m)}
                </p>
                <p className="text-[10px] text-neutral-secondary">
                  {formatMinutes(cell.nearest_charger_min)} drive time
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-1.5 text-neutral-secondary mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Substation</span>
                </div>
                <p className="font-bold text-neutral-text tabular-nums text-sm">
                  {formatDistanceKm(cell.dist_substation_m)}
                </p>
                <p className="text-[10px] text-neutral-secondary">Grid interconnection</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-1.5 text-neutral-secondary mb-1">
                  <Car className="w-3.5 h-3.5 text-accent" />
                  <span>EVs in Catchment</span>
                </div>
                <p className="font-bold text-neutral-text tabular-nums text-sm">
                  {formatIndianNumber(cell.ev_count)}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center space-x-1.5 text-neutral-secondary mb-1">
                  <Users className="w-3.5 h-3.5 text-neutral-secondary" />
                  <span>Population</span>
                </div>
                <p className="font-bold text-neutral-text tabular-nums text-sm">
                  {formatIndianNumber(cell.population)}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-neutral-secondary">Zoning / Land Use:</span>
              <span className="font-semibold text-neutral-text capitalize">{cell.land_use.replace("_", " ")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-neutral-border bg-slate-50">
        <button
          onClick={() => onPromoteCandidate?.(cell)}
          className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
        >
          <span>Promote to Candidate Site</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
