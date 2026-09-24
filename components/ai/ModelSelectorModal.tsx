"use client";

import React, { useState, useEffect } from "react";
import { SlidersHorizontal, X, Check, Zap, Shield, Sparkles, Cpu } from "lucide-react";
import { CATALOG_MODELS } from "@/lib/ai/providers";
import { AutonomyMode, ModelAssignments, DEFAULT_MODEL_ASSIGNMENTS } from "@/lib/ai/router";

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignments: ModelAssignments) => void;
}

export function ModelSelectorModal({ isOpen, onClose, onSave }: ModelSelectorModalProps) {
  const [assignments, setAssignments] = useState<ModelAssignments>(DEFAULT_MODEL_ASSIGNMENTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("guardian_model_assignments");
      if (stored) {
        setAssignments((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem("guardian_model_assignments", JSON.stringify(assignments));
    } catch {}
    onSave(assignments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">AI Models & Autonomy Router</h2>
              <p className="text-[11px] text-slate-400">Configure model specializations and execution autonomy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Autonomy Mode Selector (YOLO, Ask Important, Always Ask) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent Autonomy Mode</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "yolo", name: "⚡ YOLO", desc: "Full autonomous execution without asking" },
              { id: "ask_important", name: "🛡️ Ask on Important", desc: "Auto safe tasks, ask on conflicts" },
              { id: "always_ask", name: "✋ Always Ask", desc: "Asks confirmation on any write" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAssignments({ ...assignments, autonomy_mode: mode.id as AutonomyMode })}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  assignments.autonomy_mode === mode.id
                    ? "bg-sky-500/20 border-sky-500 text-sky-200 shadow-md shadow-sky-500/10"
                    : "bg-slate-950 border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="font-bold text-xs">{mode.name}</div>
                <div className="text-[9px] text-slate-400 mt-1 leading-tight">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Model Category Dropdowns */}
        <div className="space-y-3 text-xs pt-2 border-t border-white/10">
          {/* Chat Model */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              💬 General Chat & Orchestration Model
            </label>
            <select
              value={assignments.chat_model}
              onChange={(e) => setAssignments({ ...assignments, chat_model: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {CATALOG_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Reasoning Model */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              🧠 Deep Reasoning Model (Conflicts & Diagnostics)
            </label>
            <select
              value={assignments.reasoning_model}
              onChange={(e) => setAssignments({ ...assignments, reasoning_model: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {CATALOG_MODELS.filter((m) => m.category === "reasoning" || m.is_free).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Coding Model */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              💻 Coding & Patch Model (Syntax & AST Fixes)
            </label>
            <select
              value={assignments.coding_model}
              onChange={(e) => setAssignments({ ...assignments, coding_model: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {CATALOG_MODELS.filter((m) => m.category === "coding" || m.is_offline).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Fast / MoE Model */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              ⚡ Fast / MoE Model (Linting & Quick Triage)
            </label>
            <select
              value={assignments.fast_model}
              onChange={(e) => setAssignments({ ...assignments, fast_model: e.target.value })}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
            >
              {CATALOG_MODELS.filter((m) => m.category === "fast" || m.category === "moe" || m.is_offline).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Model Router</span>
          </button>
        </div>
      </div>
    </div>
  );
}
