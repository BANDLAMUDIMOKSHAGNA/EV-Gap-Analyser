"use client";

import React from "react";
import { ChargerProperties } from "@/types";
import { X, Zap, Plug, ShieldCheck, MapPin, Calendar, Activity } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface StationDrawerProps {
  charger: ChargerProperties | null;
  onClose: () => void;
}

export default function StationDrawer({ charger, onClose }: StationDrawerProps) {
  if (!charger) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-80 sm:w-96 bg-white border-l border-neutral-border shadow-xl z-30 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="p-4 border-b border-neutral-border flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                charger.status === "OPERATIONAL"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}>
                {charger.status}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-800">
                {charger.charger_type}
              </span>
            </div>
            <h3 className="font-bold text-neutral-text text-sm mt-1.5 leading-snug">
              {charger.name}
            </h3>
            <p className="text-xs text-primary font-medium mt-0.5">
              Operator: {charger.operator || "Independent CPO"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Station Specs */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center space-x-1.5 text-emerald-800 mb-1">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Rated Power</span>
              </div>
              <p className="text-lg font-bold text-emerald-950 tabular-nums">
                {charger.power_kw} kW
              </p>
              <p className="text-[10px] text-emerald-700">Commercial Fast</p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center space-x-1.5 text-blue-800 mb-1">
                <Plug className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Connectors</span>
              </div>
              <p className="text-lg font-bold text-blue-950 tabular-nums">
                {charger.connector_types?.length || 1} Guns
              </p>
              <p className="text-[10px] text-blue-700">Dual Outlets</p>
            </div>
          </div>

          {/* Connector badges */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-neutral-text uppercase tracking-wider">
              Supported Standards
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {charger.connector_types?.map((conn, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-neutral-text"
                >
                  {conn}
                </span>
              ))}
            </div>
          </div>

          {/* Data Honesty / Provenance */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold text-neutral-text">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Dataset Provenance</span>
            </div>
            <p className="text-neutral-secondary text-[11px]">
              Source Registry: <span className="font-semibold text-neutral-text">{charger.source || "BEE Registry"}</span>
            </p>
            <div className="flex items-center space-x-1 text-[10px] text-neutral-secondary">
              <Calendar className="w-3 h-3" />
              <span>Verified: {formatDate(charger.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
