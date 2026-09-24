"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Zap,
  SlidersHorizontal,
  KeyRound,
  Bot,
  User,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { CATALOG_MODELS } from "@/lib/ai/providers";

interface Message {
  role: "user" | "assistant";
  content: string;
  modelUsed?: string;
  toolsExecuted?: any[];
}

interface AgentChatDrawerProps {
  onOpenKeys: () => void;
  onOpenRouter: () => void;
  autonomyMode: string;
}

export function AgentChatDrawer({ onOpenKeys, onOpenRouter, autonomyMode }: AgentChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("auto");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hello! I am your Autonomous Agentic AI for GitHub Guardian. I have full operational control over your 242 repositories, 193 forks, and pull requests. You can instruct me to merge clean PRs, rebase conflicts, sync forks, scan for secrets, or check local offline model compatibility.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let customKeys = {};
      try {
        const stored = localStorage.getItem("guardian_ai_keys");
        if (stored) customKeys = JSON.parse(stored);
      } catch {}

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          modelId: selectedModel,
          autonomyMode,
          customKeys,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          modelUsed: data.modelUsed,
          toolsExecuted: data.toolsExecuted,
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error executing request: ${e.message}. Check your API keys or selected model in Settings.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Bottom AI Control Bar (Always visible above bottom nav) */}
      <div className="fixed bottom-14 md:bottom-4 left-0 right-0 z-30 px-3 py-1 max-w-4xl mx-auto pointer-events-none">
        <div className="glass-panel p-2 rounded-2xl shadow-2xl border border-sky-500/30 bg-slate-950/90 pointer-events-auto flex items-center justify-between gap-2">
          {/* Left: Agent Trigger & Mode */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 touch-press shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">AI Agent</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
              {autonomyMode === "yolo" ? "⚡ YOLO" : autonomyMode === "always_ask" ? "✋ ASK" : "🛡️ AUTO"}
            </span>
          </button>

          {/* Center: Model Selector Dropdown in Chat Bar */}
          <div className="relative flex-1 min-w-[120px] max-w-[200px]">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 focus:outline-none focus:border-sky-500 truncate"
            >
              <option value="auto">✨ Auto-Route (Smart)</option>
              <optgroup label="Cloud Free Models">
                <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</option>
                <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B (Free)</option>
                <option value="qwen/qwen-2.5-coder-32b-instruct:free">Qwen 2.5 Coder 32B (Free)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="llama-3.1-8b-instant">Groq 8B (Instant)</option>
              </optgroup>
              <optgroup label="Local Offline Models">
                <option value="qwen2.5-coder:0.5b">Qwen 0.5B (Tiny GGUF)</option>
                <option value="qwen2.5-coder:1.5b">Qwen 1.5B (Fast Snippet)</option>
                <option value="deepseek-r1:1.5b">DeepSeek R1 1.5B (Local)</option>
                <option value="llama3.2:3b">Llama 3.2 3B (Offline)</option>
              </optgroup>
            </select>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenRouter}
              title="Configure AI Models & Autonomy"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white touch-press"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenKeys}
              title="Manage API Keys"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white touch-press"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Agent Chat Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4">
          <div className="bg-slate-950 border border-white/10 w-full md:max-w-2xl h-[85vh] md:h-[700px] rounded-t-3xl md:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Autonomous Guardian Agent</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Model: <span className="text-sky-400">{selectedModel}</span> • Autonomy:{" "}
                    <span className="text-amber-400">{autonomyMode.toUpperCase()}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-3 py-2 bg-slate-900/40 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                "Scan all repos for leaked API keys",
                "Review open PRs and auto-merge",
                "Sync all 193 forks with upstream",
                "Scan device hardware for offline model",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-medium whitespace-nowrap hover:bg-sky-500/10 hover:text-sky-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 no-scrollbar text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white"
                        : "glass-panel bg-slate-900/90 text-slate-200 border border-white/10"
                    }`}
                  >
                    {/* Tool Executions Badge */}
                    {m.toolsExecuted && m.toolsExecuted.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {m.toolsExecuted.map((t, i) => (
                          <div
                            key={i}
                            className="p-1.5 rounded-lg bg-black/40 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center gap-1.5 font-mono"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="font-bold">{t.tool}</span>: {JSON.stringify(t.result || t.args)}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {m.modelUsed && (
                      <div className="mt-1.5 pt-1.5 border-t border-white/5 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                        <span>Model: {m.modelUsed}</span>
                        <span>Autonomous Execution</span>
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 items-center text-slate-400 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Agent is reasoning and executing tools...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Instruct agent to merge PRs, rebase, sync forks..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white disabled:opacity-40 touch-press"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
