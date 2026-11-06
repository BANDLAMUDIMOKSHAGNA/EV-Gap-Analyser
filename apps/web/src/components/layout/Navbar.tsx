"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShieldAlert, Sparkles, User, Database } from "lucide-react";

const STEPS = [
  { label: "1. Explore", path: "/explorer" },
  { label: "2. Detect Gaps", path: "/gaps" },
  { label: "3. Rank Sites", path: "/ranking" },
  { label: "4. Optimise", path: "/optimizer" },
  { label: "5. Report", path: "/reports" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-neutral-border bg-white sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      {/* Brand & City Selector */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-lg shadow-sm">
            ⚡
          </div>
          <span className="font-bold text-neutral-text text-base tracking-tight hidden sm:inline">
            EV Gap Analyser
          </span>
        </Link>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs text-neutral-secondary font-medium border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>Visakhapatnam, AP</span>
        </div>
      </div>

      {/* Stepper */}
      <nav className="hidden lg:flex items-center space-x-1">
        {STEPS.map((s, idx) => {
          const isActive = pathname === s.path;
          return (
            <Link
              key={s.path}
              href={s.path}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-neutral-secondary hover:text-neutral-text hover:bg-slate-100"
              }`}
            >
              <span>{s.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Tools & Badges */}
      <div className="flex items-center space-x-3">
        {/* Data Honesty Demo Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden md:inline">Demo Data</span>
          <span className="text-[10px] font-normal text-amber-700 hidden xl:inline">(Vahan / BEE 2024)</span>
        </div>

        {/* Datasets link */}
        <Link
          href="/datasets"
          className="p-1.5 rounded-md text-neutral-secondary hover:text-neutral-text hover:bg-slate-100 text-xs flex items-center space-x-1"
          title="Datasets Provenance & Transparency"
        >
          <Database className="w-4 h-4" />
          <span className="hidden md:inline font-medium">Datasets</span>
        </Link>

        {/* User Role Badge */}
        <div className="flex items-center space-x-1.5 pl-2 border-l border-neutral-border">
          <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs">
            P
          </div>
          <div className="hidden sm:block text-left text-xs leading-tight">
            <p className="font-semibold text-neutral-text">City Planner</p>
            <p className="text-[10px] text-neutral-secondary">GVMC Urban Body</p>
          </div>
        </div>
      </div>
    </header>
  );
}
