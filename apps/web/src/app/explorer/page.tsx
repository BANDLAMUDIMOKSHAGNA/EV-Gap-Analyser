"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchChargers, fetchCells } from "@/lib/api";
import MapView from "@/components/map/MapView";
import StationDrawer from "@/components/drawer/StationDrawer";
import { ChargerProperties } from "@/types";
import { Filter, Layers, Zap, MapPin, RefreshCw, AlertCircle } from "lucide-react";

export default function ExplorerPage() {
  const [selectedCharger, setSelectedCharger] = useState<ChargerProperties | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [operatorFilter, setOperatorFilter] = useState<string>("");
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // Queries
  const { data: chargersData, isLoading: chargersLoading, refetch: refetchChargers } = useQuery({
    queryKey: ["chargers", typeFilter, operatorFilter],
    queryFn: () =>
      fetchChargers("vizag", {
        type: typeFilter === "ALL" ? undefined : typeFilter,
        operator: operatorFilter || undefined,
      }),
  });

  const { data: cellsData, isLoading: cellsLoading } = useQuery({
    queryKey: ["cells", "vizag"],
    queryFn: () => fetchCells("vizag"),
    enabled: showHeatmap,
  });

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Floating Filter Bar */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-neutral-border shadow-lg space-y-3 w-80 sm:w-96 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2 font-bold text-neutral-text text-sm">
            <Layers className="w-4 h-4 text-primary" />
            <span>Map Layers & Filters</span>
          </div>
          <button
            onClick={() => refetchChargers()}
            className="p-1 rounded hover:bg-slate-100 text-neutral-secondary"
            title="Refresh Map"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-secondary">Charger Type:</span>
            <div className="flex rounded-md bg-slate-100 p-0.5 border border-slate-200">
              {["ALL", "DC_FAST", "AC_TYPE2"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    typeFilter === t
                      ? "bg-white text-primary shadow-xs"
                      : "text-neutral-secondary hover:text-neutral-text"
                  }`}
                >
                  {t === "ALL" ? "All" : t === "DC_FAST" ? "DC Fast" : "AC"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-secondary">Layer Overlay:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
              <span className="text-xs text-neutral-text font-medium">Gap Heatmap</span>
            </label>
          </div>
        </div>

        {/* Status ticker */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-neutral-secondary">
          <span>Found {chargersData?.features.length || 0} chargers</span>
          <span className="text-emerald-700 font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Grid Ready</span>
          </span>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 w-full h-full">
        <MapView
          cells={showHeatmap ? cellsData : undefined}
          chargers={chargersData}
          activeMetric="gap_score"
          selectedChargerId={selectedCharger?.id}
          onSelectCharger={(props) => setSelectedCharger(props)}
        />
      </div>

      {/* Station Drawer */}
      <StationDrawer
        charger={selectedCharger}
        onClose={() => setSelectedCharger(null)}
      />
    </div>
  );
}
