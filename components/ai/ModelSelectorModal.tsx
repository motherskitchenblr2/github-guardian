"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  Zap,
  Shield,
  Sparkles,
  Cpu,
  Globe,
  Search,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Layers,
  CheckCircle2,
  Activity,
  Terminal,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import { CATALOG_MODELS } from "@/lib/ai/providers";
import { AutonomyMode, ModelAssignments, DEFAULT_MODEL_ASSIGNMENTS } from "@/lib/ai/router";

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignments: ModelAssignments) => void;
}

interface OpenRouterModelItem {
  id: string;
  name: string;
  provider: "openrouter";
  context_length: number;
  is_free: boolean;
  pricing_prompt?: string;
  pricing_completion?: string;
  category: "chat" | "reasoning" | "coding" | "fast";
  description: string;
}

const INITIAL_OPENROUTER_MODELS: OpenRouterModelItem[] = CATALOG_MODELS.filter(
  (m) => m.provider === "openrouter"
).map((m) => ({
  id: m.id,
  name: m.name,
  provider: "openrouter",
  context_length: m.context_length,
  is_free: m.is_free,
  pricing_prompt: "0",
  pricing_completion: "0",
  category: m.category as any,
  description: `${m.name} cloud endpoint via OpenRouter.`,
}));

export function ModelSelectorModal({ isOpen, onClose, onSave }: ModelSelectorModalProps) {
  const [assignments, setAssignments] = useState<ModelAssignments>(DEFAULT_MODEL_ASSIGNMENTS);

  // Live OpenRouter models state
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModelItem[]>(INITIAL_OPENROUTER_MODELS);
  const [openRouterLoading, setOpenRouterLoading] = useState(false);
  const [openRouterKeyPresent, setOpenRouterKeyPresent] = useState(false);
  const [openRouterSearch, setOpenRouterSearch] = useState("");
  const [openRouterFilter, setOpenRouterFilter] = useState<"all" | "free" | "coding" | "reasoning" | "chat">("all");
  const [openRouterVisibleCount, setOpenRouterVisibleCount] = useState(12);

  // Local Ollama models state
  const [installedOllamaModels, setInstalledOllamaModels] = useState<any[]>([]);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);

  // Wire feedback toast
  const [wireToast, setWireToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load saved assignments
    try {
      const stored = localStorage.getItem("guardian_model_assignments");
      if (stored) {
        setAssignments((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch {}

    // Check OpenRouter key
    let orKey = "";
    try {
      const keysRaw = localStorage.getItem("guardian_ai_keys");
      if (keysRaw) {
        const parsed = JSON.parse(keysRaw);
        if (parsed.openrouter) {
          orKey = parsed.openrouter;
          setOpenRouterKeyPresent(true);
        }
      }
    } catch {}

    fetchLiveOpenRouterModels(orKey);
    fetchInstalledOllamaModels();
  }, [isOpen]);

  const showWireToast = (msg: string) => {
    setWireToast(msg);
    setTimeout(() => setWireToast(null), 2500);
  };

  const fetchLiveOpenRouterModels = async (key?: string) => {
    let effectiveKey = key;
    if (!effectiveKey) {
      try {
        const stored = localStorage.getItem("guardian_ai_keys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.openrouter) {
            effectiveKey = parsed.openrouter;
            setOpenRouterKeyPresent(true);
          }
        }
      } catch {}
    }

    setOpenRouterLoading(true);
    try {
      // 1. Direct browser fetch with authorization if present
      const headers: Record<string, string> = {
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://github-guardian.vercel.app",
        "X-Title": "GitHub Guardian",
      };
      if (effectiveKey) headers["Authorization"] = `Bearer ${effectiveKey}`;

      let fetched = false;
      try {
        const directRes = await fetch("https://openrouter.ai/api/v1/models", { headers });
        if (directRes.ok) {
          const json = await directRes.json();
          const raw = Array.isArray(json.data) ? json.data : [];
          if (raw.length > 0) {
            mapAndSetOpenRouterModels(raw);
            fetched = true;
          }
        }
      } catch (e) {
        // Direct fetch failed, fallback to internal API
      }

      // 2. Server proxy fallback via /api/ai/models?provider=openrouter
      if (!fetched) {
        const query = key ? `?provider=openrouter&key=${encodeURIComponent(key)}` : "?provider=openrouter";
        const proxyRes = await fetch(`/api/ai/models${query}`);
        if (proxyRes.ok) {
          const json = await proxyRes.json();
          if (Array.isArray(json.models) && json.models.length > 0) {
            setOpenRouterModels(json.models);
            fetched = true;
          }
        }
      }

      // 3. Fallback to pre-configured catalog if both remote calls fail
      if (!fetched) {
        const fallback = CATALOG_MODELS.filter((m) => m.provider === "openrouter").map((m) => ({
          id: m.id,
          name: m.name,
          provider: "openrouter" as const,
          context_length: m.context_length,
          is_free: m.is_free,
          pricing_prompt: "0",
          pricing_completion: "0",
          category: m.category as any,
          description: `${m.name} cloud endpoint via OpenRouter.`,
        }));
        setOpenRouterModels(fallback);
      }
    } catch (err) {
      console.warn("OpenRouter models fetch warning:", err);
    } finally {
      setOpenRouterLoading(false);
    }
  };

  const mapAndSetOpenRouterModels = (raw: any[]) => {
    const mapped: OpenRouterModelItem[] = raw.map((m: any) => {
      const id: string = m.id || "";
      const lower = id.toLowerCase();
      const isFree = id.endsWith(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0");
      let category: "chat" | "reasoning" | "coding" | "fast" = "chat";
      if (lower.includes("coder") || lower.includes("coding") || lower.includes("starcoder")) {
        category = "coding";
      } else if (lower.includes("r1") || lower.includes("reasoning") || lower.includes("qwq") || lower.includes("thought")) {
        category = "reasoning";
      } else if (lower.includes("flash") || lower.includes("instant") || lower.includes("mini") || lower.includes("tiny")) {
        category = "fast";
      }

      return {
        id,
        name: m.name || id.split("/").pop() || id,
        provider: "openrouter",
        context_length: m.context_length || 32768,
        is_free: isFree,
        pricing_prompt: m.pricing?.prompt || "0",
        pricing_completion: m.pricing?.completion || "0",
        category,
        description: m.description ? m.description.replace(/<[^>]*>?/gm, "").slice(0, 160) : `${id} via OpenRouter`,
      };
    });

    // Sort: free models first, then popular coding/reasoning
    mapped.sort((a, b) => {
      if (a.is_free && !b.is_free) return -1;
      if (!a.is_free && b.is_free) return 1;
      return a.name.localeCompare(b.name);
    });

    setOpenRouterModels(mapped);
  };

  const fetchInstalledOllamaModels = async () => {
    setOllamaLoading(true);
    let detected: any[] = [];
    let isOnline = false;

    // 1. Direct browser fetch to local Ollama daemon
    try {
      const res = await fetch("http://127.0.0.1:11434/api/tags", { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.models) && d.models.length > 0) {
          isOnline = true;
          detected = d.models.map((m: any) => ({
            id: m.name,
            name: m.name,
            provider: "ollama",
            size: m.size,
            size_formatted: (m.size / (1024 * 1024 * 1024)).toFixed(2) + " GB",
            quant: m.details?.quantization_level || "GGUF Q4_K_M",
            family: m.details?.family || "quantized",
            parameter_size: m.details?.parameter_size || "1.5B",
            is_offline: true,
            is_free: true,
            category: m.name.includes("coder") ? "coding" : m.name.includes("r1") ? "reasoning" : "chat",
            description: `Offline GGUF model in local Ollama daemon. Size: ${(m.size / (1024 * 1024 * 1024)).toFixed(2)} GB.`,
          }));
        }
      }
    } catch {}

    // 2. Query /api/ai/models endpoint
    try {
      const res = await fetch("/api/ai/models");
      if (res.ok) {
        const d = await res.json();
        if (d.ollama_online) isOnline = true;
        if (Array.isArray(d.installed_models) && d.installed_models.length > 0) {
          const existing = new Set(detected.map((m) => m.name));
          d.installed_models.forEach((im: any) => {
            if (!existing.has(im.name)) {
              detected.push({
                id: im.name,
                name: im.name,
                provider: "ollama",
                size: im.size || 0,
                size_formatted: im.size_formatted || "GGUF Q4_K_M",
                quant: im.quant || "GGUF Q4_K_M",
                family: im.family || "quantized",
                parameter_size: im.parameter_size || "1.5B",
                is_offline: true,
                is_free: true,
                category: im.name.includes("coder") ? "coding" : im.name.includes("r1") ? "reasoning" : "chat",
                description: `Offline GGUF model in local Ollama daemon.`,
              });
            }
          });
        }
      }
    } catch {}

    // 3. Fallback to default catalog local models if none detected
    if (detected.length === 0) {
      detected = CATALOG_MODELS.filter((m) => m.provider === "ollama").map((m) => ({
        id: m.id,
        name: m.name,
        provider: "ollama",
        size_formatted: m.parameters || "1.5B",
        quant: "GGUF Q4_K_M",
        parameter_size: m.parameters || "1.5B",
        is_offline: true,
        is_free: true,
        category: m.category,
        description: `${m.name} offline model for ARM64 Termux hardware.`,
      }));
    }

    setOllamaOnline(isOnline);
    setInstalledOllamaModels(detected);
    setOllamaLoading(false);
  };

  // Wire quick action
  const wireModelToRole = (modelId: string, role: "chat_model" | "reasoning_model" | "coding_model" | "fast_model") => {
    setAssignments((prev) => ({
      ...prev,
      [role]: modelId,
    }));
    const roleLabels = {
      chat_model: "💬 Chat",
      reasoning_model: "🧠 Reasoning",
      coding_model: "💻 Coding",
      fast_model: "⚡ Fast",
    };
    showWireToast(`Wired ${modelId.split("/").pop()} to ${roleLabels[role]}`);
  };

  const getWiredRoles = (modelId: string): string[] => {
    const roles: string[] = [];
    if (assignments.chat_model === modelId) roles.push("Chat");
    if (assignments.reasoning_model === modelId) roles.push("Reasoning");
    if (assignments.coding_model === modelId) roles.push("Coding");
    if (assignments.fast_model === modelId) roles.push("Fast");
    return roles;
  };

  // Filtered OpenRouter models
  const filteredOpenRouterModels = useMemo(() => {
    return openRouterModels.filter((m) => {
      const matchesSearch =
        !openRouterSearch ||
        m.name.toLowerCase().includes(openRouterSearch.toLowerCase()) ||
        m.id.toLowerCase().includes(openRouterSearch.toLowerCase()) ||
        m.description.toLowerCase().includes(openRouterSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (openRouterFilter === "free") return m.is_free;
      if (openRouterFilter === "coding") return m.category === "coding" || m.id.includes("coder");
      if (openRouterFilter === "reasoning") return m.category === "reasoning" || m.id.includes("r1") || m.id.includes("qwq");
      if (openRouterFilter === "chat") return m.category === "chat";

      return true;
    });
  }, [openRouterModels, openRouterSearch, openRouterFilter]);

  // Static Providers Data
  const groqModels = [
    {
      id: "llama-3.3-70b-versatile",
      name: "Groq LLaMA 3.3 70B Versatile",
      category: "coding",
      context: "128,000",
      speed: "450 tok/s",
      desc: "Ultra-fast code synthesis, multi-file diff resolution, and repository refactoring on Groq LPUs.",
    },
    {
      id: "deepseek-r1-distill-llama-70b",
      name: "Groq DeepSeek R1 Distill 70B",
      category: "reasoning",
      context: "128,000",
      speed: "380 tok/s",
      desc: "Distilled deep mathematical chain-of-thought for architectural review and PR conflict analysis.",
    },
    {
      id: "qwen-qwq-32b",
      name: "Groq QwQ 32B (Deep Reasoning)",
      category: "reasoning",
      context: "32,768",
      speed: "520 tok/s",
      desc: "Alibaba's specialized reasoning model running at blazing throughput for complex AST logic checks.",
    },
    {
      id: "llama-3.1-8b-instant",
      name: "Groq LLaMA 3.1 8B Instant",
      category: "fast",
      context: "128,000",
      speed: "750 tok/s",
      desc: "Instantaneous triage, rapid git linting, and high-frequency webhook processing.",
    },
    {
      id: "mixtral-8x7b-32768",
      name: "Groq Mixtral 8x7B (MoE)",
      category: "chat",
      context: "32,768",
      speed: "580 tok/s",
      desc: "Mixture of Experts architecture for versatile multi-domain conversation and agent dialogue.",
    },
  ];

  const googleModels = [
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      category: "coding",
      context: "1,048,576 (1M)",
      desc: "Next-gen multimodal speed champion with native repository-wide context ingestion and code synthesis.",
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      category: "reasoning",
      context: "2,097,152 (2M)",
      desc: "State-of-the-art long-horizon reasoning across millions of lines of codebase history and dependencies.",
    },
    {
      id: "google/gemini-2.0-flash-exp:free",
      name: "Gemini 2.0 Flash Exp (Free Cloud)",
      category: "fast",
      context: "1,048,576 (1M)",
      desc: "Zero-cost high-speed multimodal reasoning for rapid visual inspection and PR validation.",
    },
  ];

  const nvidiaModels = [
    {
      id: "meta/llama-3.3-70b-instruct",
      name: "NVIDIA NIM LLaMA 3.3 70B",
      category: "coding",
      context: "128,000",
      desc: "Enterprise containerized endpoint with hardware-accelerated TensorRT-LLM execution.",
    },
    {
      id: "deepseek-ai/deepseek-r1",
      name: "NVIDIA NIM DeepSeek R1",
      category: "reasoning",
      context: "64,000",
      desc: "Uncensored raw reasoning endpoint hosted on high-performance NVIDIA DGX Cloud clusters.",
    },
  ];

  const huggingFaceModels = [
    {
      id: "hf.co/bartowski/Llama-3.2-1B-Instruct-GGUF:Q4_K_M",
      name: "Llama-3.2-1B-Instruct (GGUF Q4_K_M)",
      category: "chat",
      size: "~800 MB",
      desc: "Meta's official lightweight instruct model quantized by bartowski for low-memory ARM64 devices.",
    },
    {
      id: "hf.co/unsloth/Qwen2.5-Coder-1.5B-Instruct-GGUF:Q4_K_M",
      name: "Qwen2.5-Coder-1.5B-Instruct (GGUF Q4_K_M)",
      category: "coding",
      size: "~980 MB",
      desc: "Unsloth fast quantized code specialist for instant AST syntax repairs and patch drafting.",
    },
    {
      id: "hf.co/vikhyatk/moondream2:latest",
      name: "moondream2 (Vision-Language GGUF)",
      category: "fast",
      size: "~830 MB",
      desc: "Ultra-compact edge visual AI: reads dense OCR code screenshots, UI mockups, and terminal errors.",
    },
    {
      id: "hf.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF:Q4_K_M",
      name: "SmolLM2-360M-Instruct (GGUF Q4_K_M)",
      category: "fast",
      size: "~260 MB",
      desc: "Micro-agent LLM with negligible battery draw for background terminal command confirmation.",
    },
  ];

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem("guardian_model_assignments", JSON.stringify(assignments));
    } catch {}
    onSave(assignments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Wire Feedback Toast */}
        {wireToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/90 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400/40 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{wireToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">AI Models & Autonomy Router</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-300">
                  Multi-Provider Unified
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Live model directory across all connected API providers & autonomous execution gates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: Agent Autonomy Mode Selector */}
        <div className="space-y-2 p-3.5 bg-slate-950/70 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Agent Autonomy Gate Policy</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              Current: <strong className="text-sky-300">{assignments.autonomy_mode}</strong>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: "yolo",
                name: "⚡ YOLO (Full Autonomy)",
                desc: "Autonomous execution of git commits, conflict rebase, and code healing without prompts.",
                badgeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
              },
              {
                id: "ask_important",
                name: "🛡️ Ask on Important",
                desc: "Auto-executes safe diagnostics & linting; prompts confirmation for force-push or branch locks.",
                badgeColor: "text-sky-400 border-sky-500/30 bg-sky-500/10",
              },
              {
                id: "always_ask",
                name: "✋ Always Ask",
                desc: "Strict interactive mode: requires user verification before modifying any file or PR state.",
                badgeColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
              },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAssignments({ ...assignments, autonomy_mode: mode.id as AutonomyMode })}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all touch-press ${
                  assignments.autonomy_mode === mode.id
                    ? "bg-sky-500/20 border-sky-500 text-sky-200 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/50"
                    : "bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{mode.name}</span>
                  {assignments.autonomy_mode === mode.id && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: Active Role Wiring Selectors */}
        <div className="space-y-3 p-3.5 bg-slate-950/70 border border-white/5 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Specialized Task Routing Assignments</span>
            </h3>
            <span className="text-[10px] text-slate-400">Click any model below or use dropdowns</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Chat Model */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>💬 Chat & Multi-Agent Dialogue:</span>
              </label>
              <select
                value={assignments.chat_model}
                onChange={(e) => setAssignments({ ...assignments, chat_model: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500 font-mono truncate"
              >
                {openRouterModels.length > 0 && (
                  <optgroup label="🌐 OpenRouter Live Cloud">
                    {openRouterModels.slice(0, 30).map((m) => (
                      <option key={`opt-or-${m.id}`} value={m.id}>
                        {m.name} {m.is_free ? "(Free)" : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="🦙 Ollama Local Offline">
                  {installedOllamaModels.map((m) => (
                    <option key={`opt-ol-${m.id}`} value={m.id}>
                      {m.name} (Local GGUF)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="⚡ Groq Cloud LPU">
                  {groqModels.map((m) => (
                    <option key={`opt-gq-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="♊ Google AI Studio">
                  {googleModels.map((m) => (
                    <option key={`opt-gg-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Reasoning Model */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>🧠 Deep Reasoning & Conflict Review:</span>
              </label>
              <select
                value={assignments.reasoning_model}
                onChange={(e) => setAssignments({ ...assignments, reasoning_model: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500 font-mono truncate"
              >
                {openRouterModels.length > 0 && (
                  <optgroup label="🌐 OpenRouter Live Cloud">
                    {openRouterModels
                      .filter((m) => m.category === "reasoning" || m.is_free || m.id.includes("r1"))
                      .slice(0, 25)
                      .map((m) => (
                        <option key={`opt-or-r-${m.id}`} value={m.id}>
                          {m.name} {m.is_free ? "(Free)" : ""}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="🦙 Ollama Local Offline">
                  {installedOllamaModels.map((m) => (
                    <option key={`opt-ol-r-${m.id}`} value={m.id}>
                      {m.name} (Local GGUF)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="⚡ Groq Cloud LPU">
                  {groqModels.map((m) => (
                    <option key={`opt-gq-r-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="♊ Google AI Studio">
                  {googleModels.map((m) => (
                    <option key={`opt-gg-r-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🟢 NVIDIA NIM">
                  {nvidiaModels.map((m) => (
                    <option key={`opt-nv-r-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Coding Model */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>💻 Coding, Syntax & Patch Repair:</span>
              </label>
              <select
                value={assignments.coding_model}
                onChange={(e) => setAssignments({ ...assignments, coding_model: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500 font-mono truncate"
              >
                <optgroup label="🦙 Ollama Local Offline">
                  {installedOllamaModels.map((m) => (
                    <option key={`opt-ol-c-${m.id}`} value={m.id}>
                      {m.name} (Local GGUF)
                    </option>
                  ))}
                </optgroup>
                {openRouterModels.length > 0 && (
                  <optgroup label="🌐 OpenRouter Live Cloud">
                    {openRouterModels
                      .filter((m) => m.category === "coding" || m.is_free || m.id.includes("coder"))
                      .slice(0, 25)
                      .map((m) => (
                        <option key={`opt-or-c-${m.id}`} value={m.id}>
                          {m.name} {m.is_free ? "(Free)" : ""}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="⚡ Groq Cloud LPU">
                  {groqModels.map((m) => (
                    <option key={`opt-gq-c-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="♊ Google AI Studio">
                  {googleModels.map((m) => (
                    <option key={`opt-gg-c-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Fast Model */}
            <div className="space-y-1">
              <label className="font-medium text-slate-300 flex items-center gap-1.5">
                <span>⚡ Fast / MoE Triage & Linting:</span>
              </label>
              <select
                value={assignments.fast_model}
                onChange={(e) => setAssignments({ ...assignments, fast_model: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500 font-mono truncate"
              >
                <optgroup label="⚡ Groq Cloud LPU">
                  {groqModels.map((m) => (
                    <option key={`opt-gq-f-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🦙 Ollama Local Offline">
                  {installedOllamaModels.map((m) => (
                    <option key={`opt-ol-f-${m.id}`} value={m.id}>
                      {m.name} (Local GGUF)
                    </option>
                  ))}
                </optgroup>
                {openRouterModels.length > 0 && (
                  <optgroup label="🌐 OpenRouter Live Cloud">
                    {openRouterModels
                      .filter((m) => m.category === "fast" || m.is_free || m.id.includes("flash"))
                      .slice(0, 20)
                      .map((m) => (
                        <option key={`opt-or-f-${m.id}`} value={m.id}>
                          {m.name} {m.is_free ? "(Free)" : ""}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="♊ Google AI Studio">
                  {googleModels.map((m) => (
                    <option key={`opt-gg-f-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: ALL API PROVIDERS LISTED INDIVIDUALLY ONE BELOW THE OTHER */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Connected AI Provider Engines (Individual Directories)</span>
            </h3>
            <span className="text-[11px] text-slate-400">Wire any model directly into active router</span>
          </div>

          {/* ========================================================================= */}
          {/* PROVIDER 1: OPENROUTER LIVE CLOUD MODELS                                   */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-950/80 border border-sky-500/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  🌐
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">OpenRouter Live Catalog</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      {openRouterLoading ? "Connecting..." : `${openRouterModels.length} Models Live`}
                    </span>
                    {openRouterKeyPresent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center gap-1">
                        <KeyRound className="w-2.5 h-2.5" />
                        <span>Key Connected</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Live endpoint models from OpenRouter (deepseek-r1, llama-3.3, qwen-2.5, claude, gpt, free tier)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLiveOpenRouterModels()}
                  disabled={openRouterLoading}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1.5 touch-press"
                  title="Refresh live catalog from OpenRouter API"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${openRouterLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* OpenRouter Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={openRouterSearch}
                  onChange={(e) => setOpenRouterSearch(e.target.value)}
                  placeholder="Search OpenRouter models (e.g. free, deepseek, claude, qwen, llama, gpt)..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(["all", "free", "coding", "reasoning", "chat"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setOpenRouterFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      openRouterFilter === cat
                        ? "bg-sky-500 text-white shadow-sm"
                        : "bg-slate-900 border border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat === "all" ? "All" : cat === "free" ? "🟢 Free Only" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* OpenRouter Models List */}
            {openRouterLoading && openRouterModels.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>Streaming live model catalog from OpenRouter...</span>
              </div>
            ) : filteredOpenRouterModels.length === 0 ? (
              <div className="text-center py-5 text-slate-500 text-xs">
                No OpenRouter models match &ldquo;{openRouterSearch}&rdquo;. Try another search keyword.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {filteredOpenRouterModels.slice(0, openRouterVisibleCount).map((m) => {
                    const wiredRoles = getWiredRoles(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                          wiredRoles.length > 0
                            ? "bg-sky-950/40 border-sky-500/50 shadow-sm shadow-sky-500/10"
                            : "bg-slate-900/90 border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-white truncate text-xs sm:text-[13px]">{m.name}</div>
                              <div className="text-[10px] font-mono text-slate-400 truncate">{m.id}</div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {m.is_free ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  FREE
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-white/5">
                                  Paid
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/20">
                                {m.context_length > 1000 ? `${Math.round(m.context_length / 1000)}k` : m.context_length}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.description}</p>
                        </div>

                        {/* Active Wired Badge & Wire Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                          <div className="flex items-center gap-1">
                            {wiredRoles.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 border border-sky-500 text-sky-300 flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" />
                                <span>Wired: {wiredRoles.join(", ")}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">Not wired</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => wireModelToRole(m.id, "coding_model")}
                              title="Wire model to Coding & Patch engine"
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                assignments.coding_model === m.id
                                  ? "bg-sky-500 text-white border-sky-400"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              💻 Code
                            </button>
                            <button
                              onClick={() => wireModelToRole(m.id, "reasoning_model")}
                              title="Wire model to Deep Reasoning engine"
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                assignments.reasoning_model === m.id
                                  ? "bg-indigo-500 text-white border-indigo-400"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              🧠 Reason
                            </button>
                            <button
                              onClick={() => wireModelToRole(m.id, "chat_model")}
                              title="Wire model to Chat & Orchestration engine"
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                assignments.chat_model === m.id
                                  ? "bg-teal-500 text-white border-teal-400"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              💬 Chat
                            </button>
                            <button
                              onClick={() => wireModelToRole(m.id, "fast_model")}
                              title="Wire model to Fast & MoE engine"
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                                assignments.fast_model === m.id
                                  ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              ⚡ Fast
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredOpenRouterModels.length > openRouterVisibleCount && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setOpenRouterVisibleCount((prev) => prev + 24)}
                      className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold hover:bg-sky-500/20 touch-press"
                    >
                      Show More OpenRouter Models ({filteredOpenRouterModels.length - openRouterVisibleCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PROVIDER 2: OLLAMA LOCAL DAEMON (OFFLINE ARM64 GGUF)                      */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-950/80 border border-emerald-500/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  🦙
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Ollama Local Daemon</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        ollamaOnline
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      }`}
                    >
                      {ollamaOnline ? "● Online (Port 11434)" : "● Standby / Native GGUF"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-slate-300">
                      ARM64 Offline
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Local neural execution directly on device memory with zero internet requirement
                  </p>
                </div>
              </div>
              <button
                onClick={fetchInstalledOllamaModels}
                disabled={ollamaLoading}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1.5 touch-press"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ollamaLoading ? "animate-spin" : ""}`} />
                <span>Re-scan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {installedOllamaModels.map((m) => {
                const wiredRoles = getWiredRoles(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                      wiredRoles.length > 0
                        ? "bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-500/10"
                        : "bg-slate-900/90 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate text-xs sm:text-[13px] flex items-center gap-1.5">
                            <span>{m.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-emerald-400">
                            Local Disk · {m.size_formatted || m.parameter_size} · {m.quant || "GGUF Q4_K_M"}
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          OFFLINE
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1">
                        {wiredRoles.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 border border-emerald-500 text-emerald-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Wired: {wiredRoles.join(", ")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not wired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => wireModelToRole(m.id, "coding_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.coding_model === m.id
                              ? "bg-emerald-600 text-white border-emerald-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💻 Code
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "reasoning_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.reasoning_model === m.id
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          🧠 Reason
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "chat_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.chat_model === m.id
                              ? "bg-teal-500 text-white border-teal-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "fast_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.fast_model === m.id
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          ⚡ Fast
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROVIDER 3: GROQ CLOUD LPU (ULTRA-FAST INFERENCE)                         */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-950/80 border border-amber-500/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Groq Cloud LPU</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      ⚡ 500+ Tokens/sec
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Free Tier
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Custom silicon Language Processing Units for sub-second PR analysis and rapid patch compilation
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {groqModels.map((m) => {
                const wiredRoles = getWiredRoles(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                      wiredRoles.length > 0
                        ? "bg-amber-950/40 border-amber-500/50 shadow-sm shadow-amber-500/10"
                        : "bg-slate-900/90 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate text-xs sm:text-[13px]">{m.name}</div>
                          <div className="text-[10px] font-mono text-amber-300">
                            {m.speed} · {m.context} Context Window
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          GROQ LPU
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1">
                        {wiredRoles.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 border border-amber-500 text-amber-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Wired: {wiredRoles.join(", ")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not wired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => wireModelToRole(m.id, "coding_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.coding_model === m.id
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💻 Code
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "reasoning_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.reasoning_model === m.id
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          🧠 Reason
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "chat_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.chat_model === m.id
                              ? "bg-teal-500 text-white border-teal-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "fast_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.fast_model === m.id
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          ⚡ Fast
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROVIDER 4: GOOGLE AI STUDIO (GEMINI 2.5 & MULTIMODAL)                    */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-950/80 border border-indigo-500/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  ♊
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Google AI Studio</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                      ✨ 1M - 2M Context
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Multimodal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Gemini 2.5 Pro & Flash architectures for repository-scale context windows and UI screenshot auditing
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {googleModels.map((m) => {
                const wiredRoles = getWiredRoles(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                      wiredRoles.length > 0
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-500/10"
                        : "bg-slate-900/90 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate text-xs sm:text-[13px]">{m.name}</div>
                          <div className="text-[10px] font-mono text-indigo-300">{m.context} Tokens Window</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          GEMINI
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1">
                        {wiredRoles.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 border border-indigo-500 text-indigo-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Wired: {wiredRoles.join(", ")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not wired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => wireModelToRole(m.id, "coding_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.coding_model === m.id
                              ? "bg-indigo-600 text-white border-indigo-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💻 Code
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "reasoning_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.reasoning_model === m.id
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          🧠 Reason
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "chat_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.chat_model === m.id
                              ? "bg-teal-500 text-white border-teal-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "fast_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.fast_model === m.id
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          ⚡ Fast
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROVIDER 5: NVIDIA NIM (DEVELOPER ENDPOINTS)                              */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-950/80 border border-green-500/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold text-xs">
                  🟢
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">NVIDIA NIM Microservices</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 border border-green-500/30 text-green-300">
                      Developer API
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enterprise optimized containers running on NVIDIA DGX cloud infrastructure
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {nvidiaModels.map((m) => {
                const wiredRoles = getWiredRoles(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                      wiredRoles.length > 0
                        ? "bg-green-950/40 border-green-500/50 shadow-sm shadow-green-500/10"
                        : "bg-slate-900/90 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate text-xs sm:text-[13px]">{m.name}</div>
                          <div className="text-[10px] font-mono text-green-300">{m.context} Context Window</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                          NVIDIA NIM
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1">
                        {wiredRoles.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500/20 border border-green-500 text-green-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Wired: {wiredRoles.join(", ")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not wired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => wireModelToRole(m.id, "coding_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.coding_model === m.id
                              ? "bg-green-600 text-white border-green-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💻 Code
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "reasoning_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.reasoning_model === m.id
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          🧠 Reason
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "chat_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.chat_model === m.id
                              ? "bg-teal-500 text-white border-teal-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "fast_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.fast_model === m.id
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          ⚡ Fast
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROVIDER 6: HUGGING FACE GGUF EDGE MODELS                                 */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-950/80 border border-pink-500/25 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                  🤗
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Hugging Face Edge Hub</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 border border-pink-500/30 text-pink-300">
                      GGUF Quantized
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Community open weights optimized for edge devices and offline vision/reasoning
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {huggingFaceModels.map((m) => {
                const wiredRoles = getWiredRoles(m.id);
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 transition-all ${
                      wiredRoles.length > 0
                        ? "bg-pink-950/40 border-pink-500/50 shadow-sm shadow-pink-500/10"
                        : "bg-slate-900/90 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate text-xs sm:text-[13px]">{m.name}</div>
                          <div className="text-[10px] font-mono text-pink-300">Size: {m.size} · GGUF Edge</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          HF GGUF
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{m.desc}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <div className="flex items-center gap-1">
                        {wiredRoles.length > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-500/20 border border-pink-500 text-pink-300 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>Wired: {wiredRoles.join(", ")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">Not wired</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => wireModelToRole(m.id, "coding_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.coding_model === m.id
                              ? "bg-pink-600 text-white border-pink-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💻 Code
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "reasoning_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.reasoning_model === m.id
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          🧠 Reason
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "chat_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.chat_model === m.id
                              ? "bg-teal-500 text-white border-teal-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          💬 Chat
                        </button>
                        <button
                          onClick={() => wireModelToRole(m.id, "fast_model")}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                            assignments.fast_model === m.id
                              ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          ⚡ Fast
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Coding: <strong className="text-white">{assignments.coding_model.split("/").pop()}</strong> ·
              Reasoning: <strong className="text-white">{assignments.reasoning_model.split("/").pop()}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold hover:opacity-95 flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/25 touch-press"
            >
              <Check className="w-4 h-4" />
              <span>Apply Model Router</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
