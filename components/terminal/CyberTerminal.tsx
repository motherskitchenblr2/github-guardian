"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Send, RefreshCw, Copy, Check, Trash2, Shield, Activity, Cpu } from "lucide-react";

interface CyberTerminalProps {
  showToast: (msg: string) => void;
}

export function CyberTerminal({ showToast }: CyberTerminalProps) {
  const [inputCmd, setInputCmd] = useState("");
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM BOOT] GitHub Guardian Cyber Terminal Online.`,
    `[${new Date().toLocaleTimeString()}] [TELEMETRY] Fleet: 242 Repositories | 193 Forks | Port 8765.`,
    `[${new Date().toLocaleTimeString()}] Type 'help' or tap a quick command below to interact.`,
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Live telemetry polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/terminal");
        if (res.status === 200) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch {
        // silent fallback
      }
    };

    fetchTelemetry();
    if (isLivePolling) {
      interval = setInterval(fetchTelemetry, 3000);
    }
    return () => clearInterval(interval);
  }, [isLivePolling]);

  const executeCommand = async (cmdToRun?: string) => {
    const command = (cmdToRun || inputCmd).trim();
    if (!command) return;

    if (command.toLowerCase() === "clear") {
      setLogs([`[${new Date().toLocaleTimeString()}] Terminal buffer cleared.`]);
      setInputCmd("");
      return;
    }

    setIsExecuting(true);
    setInputCmd("");
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] guardian@termux:~$ ${command}`]);

    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (data.output) {
        setLogs((prev) => [...prev, data.output]);
      }
    } catch (e: any) {
      setLogs((prev) => [...prev, `[ERROR] Command failed: ${e.message}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const copyTerminalLogs = () => {
    navigator.clipboard.writeText(logs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast("Terminal logs copied to clipboard!");
  };

  return (
    <div className="glass-panel bg-slate-950/95 border border-sky-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col space-y-3">
      {/* Top Status & Controls Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white font-mono">CYBER TERMINAL</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Live Sync & Fleet Controller</p>
          </div>
        </div>

        {/* Real System Telemetry Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {telemetry?.system && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-slate-300 font-mono">
              <Cpu className="w-3 h-3 text-sky-400" />
              <span>{telemetry.system.memory_gb}</span>
            </div>
          )}

          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              isLivePolling
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>{isLivePolling ? "LIVE SYNC ON" : "PAUSED"}</span>
          </button>

          <button
            onClick={copyTerminalLogs}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white"
            title="Copy Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setLogs([`[${new Date().toLocaleTimeString()}] Screen cleared.`])}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-red-400"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Action Command Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] text-slate-500 font-mono shrink-0">Quick Commands:</span>
        {["status", "fleet", "prs", "git status", "sync", "ai", "sweeper", "whoami", "help"].map((cmd) => (
          <button
            key={cmd}
            onClick={() => executeCommand(cmd)}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-sky-500/20 hover:border-sky-500/40 border border-white/10 text-[11px] font-mono text-slate-300 hover:text-sky-300 whitespace-nowrap touch-press transition-all"
          >
            ${cmd}
          </button>
        ))}
      </div>

      {/* Terminal Screen Console */}
      <div className="bg-[#020409] border border-cyan-500/25 rounded-xl p-3.5 font-mono text-xs text-slate-100 max-h-[360px] sm:max-h-[420px] overflow-y-auto space-y-1.5 shadow-inner">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap leading-relaxed ${
              log.includes("[ERROR]")
                ? "text-red-400"
                : log.includes("guardian@termux:~$")
                ? "text-sky-400 font-bold"
                : log.includes("[FLEET TELEMETRY]") || log.includes("[OPEN PULL REQUESTS")
                ? "text-emerald-300 font-semibold"
                : "text-slate-200"
            }`}
          >
            {log}
          </div>
        ))}
        {isExecuting && (
          <div className="flex items-center gap-2 text-sky-400 animate-pulse text-xs">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Executing daemon command...</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Interactive Command Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeCommand();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 font-mono text-xs font-bold">
            $&gt;
          </span>
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder="Type command (e.g. status, prs, sync, ai, git status)..."
            className="w-full bg-[#020409] border border-white/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={isExecuting || !inputCmd.trim()}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/25 disabled:opacity-40 transition-all touch-press"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
}
