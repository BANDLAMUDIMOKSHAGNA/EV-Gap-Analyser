"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDatasets } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import { ShieldCheck, Database, ExternalLink, Calendar, FileText, CheckCircle2 } from "lucide-react";

export default function DatasetsPage() {
  const { data: datasets, isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: fetchDatasets,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-neutral-text">Data Transparency & Provenance Registry</h1>
        </div>
        <p className="text-sm text-neutral-secondary">
          Adheres strictly to the EV Gap Analyser Data Honesty Rules. Every statistical model,
          map layer, and recommendation is traceable back to open government and academic registries.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <span className="font-bold text-sm text-amber-700">Notice:</span>
        <p className="leading-relaxed">
          The system currently operates with <span className="font-bold">DATA_MODE=demo</span>. Bundled sample
          records are calibrated against empirical Visakhapatnam urban statistics. Synthetic figures are generated
          by documented pipelines and never fabricated without proxy documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {datasets?.map((ds) => (
          <div
            key={ds.id}
            className="bg-white rounded-xl border border-neutral-border p-5 shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono text-neutral-secondary uppercase">
                  ID: {ds.id}
                </span>
                <h3 className="font-bold text-neutral-text text-base">{ds.name}</h3>
              </div>
              <div className="flex items-center space-x-2">
                {ds.is_demo && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Sample / Demo
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {ds.licence}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-secondary leading-relaxed">
              {ds.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-neutral-secondary block text-[10px] uppercase font-semibold">Primary Source</span>
                <span className="font-medium text-neutral-text">{ds.source}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-neutral-secondary block text-[10px] uppercase font-semibold">Retrieved Date</span>
                <span className="font-medium text-neutral-text">{formatDate(ds.retrieved_at)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-neutral-secondary block text-[10px] uppercase font-semibold">Source Portal</span>
                  <span className="font-medium text-primary truncate max-w-[150px] block">Public Registry</span>
                </div>
                {ds.url && (
                  <a
                    href={ds.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded hover:bg-slate-200 text-primary"
                    title="Open Source Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
