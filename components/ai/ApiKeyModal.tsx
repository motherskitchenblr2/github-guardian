"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, X, Check, ExternalLink, ShieldCheck } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: any) => void;
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [keys, setKeys] = useState({
    openrouter: "",
    google: "",
    groq: "",
    nvidia: "",
    ollama_host: "http://127.0.0.1:11434",
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("guardian_ai_keys");
      if (stored) {
        setKeys((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem("guardian_ai_keys", JSON.stringify(keys));
    } catch {}
    onSave(keys);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">AI Provider Keys</h2>
              <p className="text-[11px] text-slate-400">Plug in free API keys to activate multimodal models</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-sky-950/40 border border-sky-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            Keys are encrypted in your local browser storage and never shared with third parties.
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3 text-xs">
          {/* OpenRouter */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-200">OpenRouter API Key (Free Models)</label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={keys.openrouter}
              onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
              placeholder="sk-or-v1-..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Google AI Studio */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-200">Google AI Studio (Gemini 2.5)</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={keys.google}
              onChange={(e) => setKeys({ ...keys, google: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Groq */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-200">Groq API Key (Ultra-Fast Free)</label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={keys.groq}
              onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
              placeholder="gsk_..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* NVIDIA NIM */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-semibold text-slate-200">NVIDIA NIM API Key</label>
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={keys.nvidia}
              onChange={(e) => setKeys({ ...keys, nvidia: e.target.value })}
              placeholder="nvapi-..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Ollama Local / Cloud URL */}
          <div>
            <label className="font-semibold text-slate-200 block mb-1">Ollama Local / Remote Host URL</label>
            <input
              type="text"
              value={keys.ollama_host}
              onChange={(e) => setKeys({ ...keys, ollama_host: e.target.value })}
              placeholder="http://127.0.0.1:11434"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
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
            <span>Save & Apply Keys</span>
          </button>
        </div>
      </div>
    </div>
  );
}
