"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Compass,
  Sliders,
  Calculator,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Map Explorer", icon: Map, href: "/explorer" },
  { label: "Gap Analysis", icon: Compass, href: "/gaps" },
  { label: "Site Ranking", icon: Sliders, href: "/ranking" },
  { label: "Budget Optimiser", icon: Calculator, href: "/optimizer" },
  { label: "Reports & Scenarios", icon: FileText, href: "/reports" },
  { label: "Data Provenance", icon: Database, href: "/datasets" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-neutral-border h-[calc(100vh-3.5rem)] sticky top-14 transition-all duration-200 flex flex-col justify-between z-30 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold border-l-4 border-primary"
                  : "text-neutral-secondary hover:text-neutral-text hover:bg-slate-50"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-neutral-secondary"}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer controls & collapse button */}
      <div className="p-3 border-t border-neutral-border space-y-2">
        {!collapsed && (
          <div className="p-2.5 rounded-md bg-slate-50 text-[11px] text-neutral-secondary border border-slate-200 leading-relaxed">
            <div className="flex items-center space-x-1 font-semibold text-neutral-text mb-1">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Pilot City</span>
            </div>
            Visakhapatnam GVMC area modeled with 738 H3 hexagons (Res 8).
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-slate-100 text-neutral-secondary transition-colors text-xs font-medium"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
