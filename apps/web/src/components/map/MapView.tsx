"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { CellFeatureCollection, ChargerFeatureCollection, CandidateSite } from "@/types";

interface MapViewProps {
  cells?: CellFeatureCollection;
  chargers?: ChargerFeatureCollection;
  candidateSites?: CandidateSite[];
  activeMetric?: "gap_score" | "demand_score" | "supply_score" | "feasibility_score";
  selectedCellId?: string;
  selectedChargerId?: string;
  onSelectCell?: (cellProps: any) => void;
  onSelectCharger?: (chargerProps: any) => void;
  onSelectCandidate?: (candidate: CandidateSite) => void;
}

export default function MapView({
  cells,
  chargers,
  candidateSites,
  activeMetric = "gap_score",
  selectedCellId,
  selectedChargerId,
  onSelectCell,
  onSelectCharger,
  onSelectCandidate,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "basemap": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "© Esri, OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "basemap-layer",
            type: "raster",
            source: "basemap",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [83.3013, 17.7231], // Vizag coordinates
      zoom: 11.2,
      maxZoom: 18,
      minZoom: 9,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");

    map.on("load", () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update H3 Cells GeoJSON source & layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !cells) return;

    const source = map.getSource("h3-cells") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(cells as any);
    } else {
      map.addSource("h3-cells", {
        type: "geojson",
        data: cells as any,
      });

      // Hexagon fill layer
      map.addLayer({
        id: "h3-cells-fill",
        type: "fill",
        source: "h3-cells",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", activeMetric],
            0, "#0D9488", // Well served / low gap
            20, "#FEF3C7", // Mild gap
            45, "#FBBF24", // Moderate gap
            70, "#F59E0B", // High gap
            100, "#B91C1C", // Critical gap
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "h3_index"], selectedCellId || ""],
            0.85,
            0.55,
          ],
        },
      });

      // Hexagon border layer
      map.addLayer({
        id: "h3-cells-border",
        type: "line",
        source: "h3-cells",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "h3_index"], selectedCellId || ""],
            "#0F172A",
            "#64748B",
          ],
          "line-width": [
            "case",
            ["==", ["get", "h3_index"], selectedCellId || ""],
            2.5,
            0.8,
          ],
          "line-opacity": 0.6,
        },
      });

      // Click cell
      map.on("click", "h3-cells-fill", (e) => {
        if (e.features && e.features[0]) {
          onSelectCell?.(e.features[0].properties);
        }
      });

      map.on("mouseenter", "h3-cells-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "h3-cells-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [cells, mapLoaded, activeMetric, selectedCellId, onSelectCell]);

  // Update fill color property dynamically when activeMetric changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer("h3-cells-fill")) {
      map.setPaintProperty("h3-cells-fill", "fill-color", [
        "interpolate",
        ["linear"],
        ["get", activeMetric],
        0, activeMetric === "gap_score" ? "#0D9488" : "#E2E8F0",
        20, "#FEF3C7",
        45, "#FBBF24",
        70, "#F59E0B",
        100, activeMetric === "gap_score" ? "#B91C1C" : "#0F9D74",
      ]);
    }
  }, [activeMetric, mapLoaded]);

  // Update Chargers GeoJSON source & layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !chargers) return;

    const source = map.getSource("chargers") as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(chargers as any);
    } else {
      map.addSource("chargers", {
        type: "geojson",
        data: chargers as any,
      });

      // Charger point outer halo
      map.addLayer({
        id: "chargers-halo",
        type: "circle",
        source: "chargers",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "id"], selectedChargerId || ""],
            14,
            9,
          ],
          "circle-color": "#FFFFFF",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0F172A",
        },
      });

      // Charger point inner circle
      map.addLayer({
        id: "chargers-point",
        type: "circle",
        source: "chargers",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "id"], selectedChargerId || ""],
            10,
            6,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "charger_type"], "DC_FAST"],
            "#0F9D74", // Emerald for DC Fast
            "#2563EB", // Blue for AC Fast
          ],
        },
      });

      map.on("click", "chargers-halo", (e) => {
        if (e.features && e.features[0]) {
          onSelectCharger?.(e.features[0].properties);
        }
      });

      map.on("mouseenter", "chargers-halo", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "chargers-halo", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [chargers, mapLoaded, selectedChargerId, onSelectCharger]);

  // Update Candidate Sites markers
  const markersRef = useRef<maplibregl.Marker[]>([]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (candidateSites && candidateSites.length > 0) {
      candidateSites.forEach((site) => {
        const el = document.createElement("div");
        el.className =
          "flex items-center justify-center w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform";
        el.innerText = site.rank ? `#${site.rank}` : "★";
        el.title = `${site.name} (TOPSIS Score: ${site.topsis_score})`;

        el.addEventListener("click", () => {
          onSelectCandidate?.(site);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([site.lon, site.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [candidateSites, mapLoaded, onSelectCandidate]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Colour-blind safe legend overlay */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-neutral-border shadow-md text-xs space-y-1.5 max-w-xs">
        <div className="font-semibold text-neutral-text flex items-center justify-between">
          <span className="capitalize">{activeMetric.replace("_", " ")}</span>
          <span className="text-[10px] text-neutral-secondary font-normal">0 to 100</span>
        </div>
        <div className="h-2.5 w-48 rounded-full bg-gradient-to-r from-teal-600 via-amber-400 to-red-700" />
        <div className="flex justify-between text-[10px] text-neutral-secondary">
          <span>Well Served</span>
          <span>Moderate</span>
          <span>Critical Gap</span>
        </div>
        <div className="pt-1.5 border-t border-slate-100 flex items-center space-x-3 text-[10px]">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            <span>DC Fast</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
            <span>AC Slow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
