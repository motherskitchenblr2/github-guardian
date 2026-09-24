"use client";

import React, { useState, useEffect } from "react";
import { Cpu, HardDrive, CpuIcon, CheckCircle2, Download, Zap, Sparkles } from "lucide-react";

export function HardwareAdvisor() {
  const [specs, setSpecs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/hardware")
      .then((r) => r.json())
      .then((d) => setSpecs(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-4 rounded-2xl animate-pulse text-xs text-slate-400">
        Scanning device hardware capacity...
      </div>
    );
  }

  if (!specs) return null;

  const ramPercent = Math.min(100, Math.round(((specs.total_ram_gb - specs.available_ram_gb) / specs.total_ram_gb) * 100));

  return (
    <div className="glass-panel p-4 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-slate-900/90 to-slate-950/90">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Device AI Capacity Advisor</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                {specs.architecture}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {specs.cpu_cores} Cores • {specs.available_ram_gb} GB Free RAM of {specs.total_ram_gb} GB
            </p>
          </div>
        </div>
      </div>

      {/* RAM Meter */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>RAM Utilization</span>
          <span>{ramPercent}% used</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              ramPercent > 85 ? "bg-amber-400" : "bg-sky-400"
            }`}
            style={{ width: `${ramPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Recommended Model Callout */}
      <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl mb-3 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <div className="font-bold text-sky-200">
            Recommended Local Model: <span className="text-white">{specs.recommended_local_model}</span>
          </div>
          <div className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
            {specs.recommended_reasoning}
          </div>
        </div>
      </div>

      {/* Eligible Models Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {specs.eligible_models?.map((m: any) => (
          <div
            key={m.tag}
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
              m.recommended
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : "bg-slate-900/50 border-white/5 text-slate-300"
            }`}
          >
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>{m.name}</span>
                {m.recommended && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                    OPTIMAL
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{m.description}</div>
            </div>
            <code className="text-[10px] font-mono text-slate-400 shrink-0">~{m.ram_needed_gb}GB</code>
          </div>
        ))}
      </div>
    </div>
  );
}
