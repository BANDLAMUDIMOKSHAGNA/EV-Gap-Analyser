"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCheck, Key, ArrowRight, Zap, Compass } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("planner.gvmc@ap.gov.in");
  const [password, setPassword] = useState("password123");
  const [role, setRole] = useState("planner");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Demo login stores token in localStorage & redirects
    localStorage.setItem("ev_gap_token", "demo-jwt-token-2024");
    localStorage.setItem("ev_gap_role", role);
    setTimeout(() => {
      router.push("/");
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-border shadow-xl p-8 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
            ⚡
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-text">
            EV Gap Analyser
          </h1>
          <p className="text-xs text-neutral-secondary">
            Find where India needs EV chargers next. Decision-support platform for municipal bodies and CPOs.
          </p>
        </div>

        {/* Role Quick Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-secondary block text-center">
            Select Evaluation Role:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "planner", label: "Planner", badge: "GVMC Urban" },
              { id: "admin", label: "Admin", badge: "Full Access" },
              { id: "viewer", label: "Viewer", badge: "Public" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-2 rounded-lg border text-center transition-all ${
                  role === r.id
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                    : "border-slate-200 text-neutral-secondary hover:bg-slate-50"
                }`}
              >
                <div className="text-xs">{r.label}</div>
                <div className="text-[9px] text-neutral-secondary font-normal">{r.badge}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-neutral-text">Official Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-text">Security Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>{isLoading ? "Signing in..." : "Enter Planning Console"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-neutral-secondary">
          <span>Operating in </span>
          <span className="font-semibold text-amber-700">DATA_MODE=demo</span>
          <span> for Visakhapatnam, AP</span>
        </div>
      </div>
    </div>
  );
}
