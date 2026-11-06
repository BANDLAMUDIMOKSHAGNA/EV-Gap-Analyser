"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCells, fetchChargers, triggerRun } from "@/lib/api";
import CellDrawer from "@/components/drawer/CellDrawer";
import { CellProperties } from "@/types";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm font-medium">
      Loading spatial gap heatmap...
    </div>
  ),
});
import {
  Compass,
  Play,
  Clock,
  Flame,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Layers
} from "lucide-react";

export default function GapAnalysisPage() {
  const queryClient = useQueryClient();
  const [selectedCell, setSelectedCell] = useState<CellProperties | null>(null);
  const [activeMetric, setActiveMetric] = useState<"gap_score" | "demand_score" | "supply_score" | "feasibility_score">("gap_score");
  const [travelMinutes, setTravelMinutes] = useState<number>(10);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  // Queries
  const { data: cellsData, isLoading: cellsLoading, refetch: refetchCells } = useQuery({
    queryKey: ["cells", "vizag"],
    queryFn: () => fetchCells("vizag"),
  });

  const { data: chargersData } = useQuery({
    queryKey: ["chargers", "vizag"],
    queryFn: () => fetchChargers("vizag"),
  });

  // Calculate top underserved hotspot cells (top 5 by gap score)
  const hotspots = React.useMemo(() => {
    if (!cellsData?.features) return [];
    return [...cellsData.features]
      .sort((a, b) => b.properties.gap_score - a.properties.gap_score)
      .slice(0, 5);
  }, [cellsData]);

  // Mutation to run a new analysis with chosen travel minutes
  const handleRunAnalysis = async (mins: number) => {
    setTravelMinutes(mins);
    setIsTriggering(true);
    try {
      await triggerRun({
        city_id: "vizag",
        travel_minutes: mins,
        h3_res: 8,
      });
      // Short delay to allow background processing then refetch
      setTimeout(() => {
        refetchCells();
        setIsTriggering(false);
      }, 2500);
    } catch {
      setIsTriggering(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-neutral-border shadow-xl space-y-3.5 w-80 sm:w-96 text-xs">
        {/* Metric Segmented Control */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-neutral-text text-xs flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-primary" />
              <span>Spatial Scoring Metric</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: "gap_score", label: "Combined Gap" },
              { id: "demand_score", label: "Demand Score" },
              { id: "supply_score", label: "Supply Score" },
              { id: "feasibility_score", label: "Feasibility" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                className={`py-1.5 px-2 rounded-md font-semibold text-[11px] transition-all text-center ${
                  activeMetric === m.id
                    ? "bg-white text-primary shadow-xs"
                    : "text-neutral-secondary hover:text-neutral-text"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-neutral-secondary mt-1.5 flex items-center space-x-1">
            <Info className="w-3 h-3 text-primary flex-shrink-0" />
            <span>Higher gap score means more unmet charging demand.</span>
          </p>
        </div>

        {/* Travel Catchment Threshold Selector */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium text-neutral-secondary">Travel Time Catchment:</span>
            <span className="font-semibold text-primary">{travelMinutes} min drive</span>
          </div>

          <div className="flex items-center space-x-2">
            {[5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => handleRunAnalysis(mins)}
                disabled={isTriggering}
                className={`flex-1 py-1.5 rounded-md font-semibold text-xs border transition-all ${
                  travelMinutes === mins
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-slate-50 text-neutral-secondary border-slate-200 hover:bg-slate-100"
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {/* Top Hotspots Quick List */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-neutral-text text-xs flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span>Top Underserved Hotspots</span>
            </span>
            <span className="text-[10px] text-neutral-secondary font-mono">DBSCAN</span>
          </div>

          <div className="space-y-1">
            {hotspots.map((f, i) => (
              <button
                key={f.properties.h3_index}
                onClick={() => setSelectedCell(f.properties)}
                className="w-full p-1.5 rounded-md hover:bg-slate-50 border border-slate-100 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-700 font-bold text-[10px] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-neutral-text text-[11px] capitalize truncate max-w-[150px]">
                    {f.properties.land_use.replace("_", " ")} Hub
                  </span>
                </div>
                <span className="tabular-nums font-bold text-red-700 text-xs">
                  {f.properties.gap_score}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 w-full h-full">
        <MapView
          cells={cellsData}
          chargers={chargersData}
          activeMetric={activeMetric}
          selectedCellId={selectedCell?.h3_index}
          onSelectCell={(props) => setSelectedCell(props)}
        />
      </div>

      {/* Hexagon Detail Drawer */}
      <CellDrawer
        cell={selectedCell}
        onClose={() => setSelectedCell(null)}
        onPromoteCandidate={(cell) => {
          // Promote to candidate workflow
          alert(`Promoted cell #${cell.h3_index.slice(-6)} to Candidate Sites queue!`);
        }}
      />
    </div>
  );
}
