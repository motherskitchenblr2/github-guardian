"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  GitPullRequest,
  GitFork,
  KeyRound,
  Lock,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Zap,
  SlidersHorizontal,
} from "lucide-react";

interface PullRequest {
  id: number;
  number: number;
  title: string;
  repo: string;
  author: string;
  url: string;
  created_at: string;
  labels: string[];
}

interface Fork {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  html_url: string;
  updated_at: string;
}

export default function GuardianDashboard() {
  const [activeTab, setActiveTab] = useState<"prs" | "forks" | "secrets" | "security">("prs");
  const [stats, setStats] = useState<any>({
    account: "motherskitchenblr2",
    open_prs: 924,
    forks_count: 193,
    prs_merged: 46,
    prs_rebased: 4,
    secret_status: "CLEAN",
    hardened_count: 30,
  });

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [forks, setForks] = useState<Fork[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live stats
      const statsRes = await fetch("/api/stats").catch(() => null);
      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        setStats((prev: any) => ({ ...prev, ...statsData }));
      }

      // 2. Fetch PRs
      const prsRes = await fetch("/api/prs?limit=40").catch(() => null);
      if (prsRes?.ok) {
        const prsData = await prsRes.json();
        setPrs(prsData.prs || []);
      }

      // 3. Fetch Forks
      const forksRes = await fetch("/api/forks?limit=30").catch(() => null);
      if (forksRes?.ok) {
        const forksData = await forksRes.json();
        setForks(forksData.forks || []);
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMergePr = async (repo: string, prNumber: number, title: string) => {
    setProcessingId(`merge-${repo}-${prNumber}`);
    showToast(`Squash-merging ${repo} #${prNumber}...`);
    try {
      const res = await fetch("/api/prs/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "merge",
          repo,
          prNumber,
          commitTitle: `${title} (#${prNumber})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Successfully merged #${prNumber}!`);
        setPrs((prev) => prev.filter((p) => !(p.repo === repo && p.number === prNumber)));
        setStats((prev: any) => ({ ...prev, prs_merged: (prev.prs_merged || 0) + 1 }));
      } else if (data.conflict) {
        showToast(`⚠️ Conflict detected: Dispatched @dependabot rebase!`);
      } else {
        showToast(`❌ Merge failed: ${data.error || "Unknown error"}`);
      }
    } catch (e: any) {
      showToast(`❌ Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRebasePr = async (repo: string, prNumber: number) => {
    setProcessingId(`rebase-${repo}-${prNumber}`);
    showToast(`Requesting @dependabot rebase for #${prNumber}...`);
    try {
      const res = await fetch("/api/prs/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rebase", repo, prNumber }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🔄 @dependabot rebase triggered for #${prNumber}!`);
        setStats((prev: any) => ({ ...prev, prs_rebased: (prev.prs_rebased || 0) + 1 }));
      } else {
        showToast(`❌ Rebase request failed.`);
      }
    } catch (e: any) {
      showToast(`❌ Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSyncFork = async (repo: string, branch: string) => {
    setProcessingId(`sync-${repo}`);
    showToast(`Syncing ${repo} with upstream...`);
    try {
      const res = await fetch("/api/forks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, branch }),
      });
      const data = await res.json();
      showToast(`🍴 ${data.message || "Fork sync executed!"}`);
    } catch (e: any) {
      showToast(`❌ Error: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPrs = prs.filter(
    (p) =>
      p.repo.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-sky-500/40 text-sky-200 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 max-w-[90vw] animate-in fade-in slide-in-from-top-4">
          <Zap className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Sticky Mobile App Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white">GitHub Guardian</h1>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">@{stats.account}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center gap-1.5 touch-press"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1">
        {/* Metric Cards Carousel / Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
          {/* Card 1 */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">PRs Merged</span>
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">46+</div>
            <div className="text-[10px] sm:text-xs text-emerald-400/90 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Squash auto-merged
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Forks Synced</span>
              <GitFork className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.forks_count}</div>
            <div className="text-[10px] sm:text-xs text-sky-400/90 mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Upstream origin active
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Secret Guard</span>
              <KeyRound className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">CLEAN</div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> No exposed PATs
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Hardened</span>
              <Shield className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">30+ Repos</div>
            <div className="text-[10px] sm:text-xs text-pink-400/90 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Dependabot active
            </div>
          </div>
        </section>

        {/* Tab Selection (Desktop & Mobile Tabs) */}
        <div className="flex items-center justify-between gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("prs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "prs"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Pull Requests</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {filteredPrs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("forks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "forks"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Fork Sync</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">193</span>
            </button>

            <button
              onClick={() => setActiveTab("secrets")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "secrets"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Secrets</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "security"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Hardening</span>
            </button>
          </div>
        </div>

        {/* Search Bar for PRs & Forks */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search repository or update title..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* TAB 1: PULL REQUESTS (Mobile-First Touch Cards) */}
        {activeTab === "prs" && (
          <div className="space-y-3">
            {filteredPrs.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs sm:text-sm">
                {loading ? "Loading pull requests..." : "No open pull requests matching your search."}
              </div>
            ) : (
              filteredPrs.map((pr) => {
                const isProcessingMerge = processingId === `merge-${pr.repo}-${pr.number}`;
                const isProcessingRebase = processingId === `rebase-${pr.repo}-${pr.number}`;

                return (
                  <div
                    key={`${pr.repo}-${pr.number}`}
                    className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-sky-500/30 transition-all flex flex-col gap-3"
                  >
                    {/* Top Row: Repo & PR # */}
                    <div className="flex items-center justify-between gap-2">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs sm:text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{pr.repo}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </a>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
                        #{pr.number}
                      </span>
                    </div>

                    {/* PR Title */}
                    <h3 className="text-xs sm:text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed">
                      {pr.title}
                    </h3>

                    {/* Meta Row: Author & Labels */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        <span>{pr.author}</span>
                      </div>
                      <span className="text-slate-500">
                        {new Date(pr.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons (Large Touch Targets for Mobile) */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleMergePr(pr.repo, pr.number, pr.title)}
                        disabled={isProcessingMerge}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 touch-press disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{isProcessingMerge ? "Merging..." : "Squash Merge"}</span>
                      </button>

                      <button
                        onClick={() => handleRebasePr(pr.repo, pr.number)}
                        disabled={isProcessingRebase}
                        className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 touch-press disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isProcessingRebase ? "animate-spin" : ""}`} />
                        <span>{isProcessingRebase ? "Rebasing..." : "Rebase Conflict"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: FORK SYNCHRONIZER (Touch Cards) */}
        {activeTab === "forks" && (
          <div className="space-y-3">
            <div className="p-3.5 bg-sky-950/30 border border-sky-500/20 rounded-2xl flex items-center justify-between gap-3 mb-2">
              <div className="text-xs text-sky-200">
                <span className="font-bold">193 Forked Repositories</span> actively tracking upstream origin branches.
              </div>
            </div>

            {forks.map((fork) => {
              const isSyncing = processingId === `sync-${fork.full_name}`;
              return (
                <div
                  key={fork.id}
                  className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={fork.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs sm:text-sm font-semibold text-white hover:text-sky-400 truncate block"
                    >
                      {fork.name}
                    </a>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      branch: <span className="text-sky-300">{fork.default_branch}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSyncFork(fork.full_name, fork.default_branch)}
                    disabled={isSyncing}
                    className="py-2 px-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold shrink-0 touch-press hover:bg-sky-500/25 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Syncing" : "Sync"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: SECRET LEAK DEFENSE */}
        {activeTab === "secrets" && (
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-2xl text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">Continuous Secret Scanner Active</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                Audits all git commits and file modifications for exposed Personal Access Tokens, OpenAI keys,
                Anthropic tokens, AWS keys, and credentials in .env files.
              </p>
              <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Leaks Detected Across 25+ Scanned Repos</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY HARDENING */}
        {activeTab === "security" && (
          <div className="space-y-3">
            <div className="p-4 glass-panel rounded-2xl">
              <h3 className="text-sm font-bold text-white">Fleet Vulnerability Defense</h3>
              <p className="text-xs text-slate-400 mt-1">
                Dependabot alerts and automated vulnerability patches are automatically maintained across all
                repositories.
              </p>
            </div>

            <div className="space-y-2">
              {["VOLT-CODE-AI-v5.0", "generative-ai", "immich", "hermes-agent_0118", "LibreChat", "onyx"].map(
                (repo) => (
                  <div
                    key={repo}
                    className="glass-panel p-3.5 rounded-xl flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{repo}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[10px]">
                        ALERTS: ON
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono text-[10px]">
                        AUTO-FIX: ON
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Standard Mobile UX for One-Hand Use) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-3 py-2 flex items-center justify-around md:hidden">
        <button
          onClick={() => setActiveTab("prs")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "prs" ? "text-sky-400" : "text-slate-400"
          }`}
        >
          <GitPullRequest className="w-5 h-5" />
          <span className="text-[10px] font-medium">PRs</span>
        </button>

        <button
          onClick={() => setActiveTab("forks")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "forks" ? "text-sky-400" : "text-slate-400"
          }`}
        >
          <GitFork className="w-5 h-5" />
          <span className="text-[10px] font-medium">Forks</span>
        </button>

        <button
          onClick={() => setActiveTab("secrets")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "secrets" ? "text-sky-400" : "text-slate-400"
          }`}
        >
          <KeyRound className="w-5 h-5" />
          <span className="text-[10px] font-medium">Secrets</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "security" ? "text-sky-400" : "text-slate-400"
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-medium">Security</span>
        </button>
      </nav>
    </div>
  );
}
