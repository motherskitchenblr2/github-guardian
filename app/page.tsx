"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  GitPullRequest,
  GitFork,
  KeyRound,
  Lock,
  Globe,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Search,
  Zap,
  Star,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Bot,
  Terminal,
  Building2,
  UserCheck,
  Plus,
  Rocket,
  Database,
} from "lucide-react";
import { HardwareAdvisor } from "@/components/ai/HardwareAdvisor";
import { ApiKeyModal } from "@/components/ai/ApiKeyModal";
import { ModelSelectorModal } from "@/components/ai/ModelSelectorModal";
import { AgentChatDrawer } from "@/components/ai/AgentChatDrawer";
import { ExecutiveOffice } from "@/components/office/ExecutiveOffice";
import { CyberTerminal } from "@/components/terminal/CyberTerminal";
import { MultimodalAiSuite } from "@/components/ai/MultimodalAiSuite";
import { MultiAccountManager } from "@/components/integrations/MultiAccountManager";
import { BranchProtectionManager } from "@/components/security/BranchProtectionManager";
import { AutonomyMode, ModelAssignments, DEFAULT_MODEL_ASSIGNMENTS } from "@/lib/ai/router";

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

interface RepositoryItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  visibility: "public" | "private";
  fork: boolean;
  description: string;
  html_url: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  updated_at: string;
}

const HUGGINGFACE_REPOS = [
  {
    id: "bartowski/Llama-3.2-1B-Instruct-GGUF",
    name: "Llama-3.2-1B-Instruct-GGUF",
    author: "bartowski",
    type: "model" as const,
    private: false,
    downloads: "142.8k",
    likes: 310,
    pipeline_tag: "Text Generation",
    quant: "Q4_K_M",
    desc: "Meta's edge conversational LLM optimized for ARM64 & Termux offline execution.",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF",
  },
  {
    id: "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
    name: "Qwen2.5-Coder-1.5B-Instruct-GGUF",
    author: "Qwen",
    type: "model" as const,
    private: false,
    downloads: "295.4k",
    likes: 540,
    pipeline_tag: "Code Synthesis",
    quant: "Q4_K_M",
    desc: "Autonomous code patch generation, AST syntax repair, and PR diff solver.",
    url: "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
  },
  {
    id: "unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF",
    name: "DeepSeek-R1-Distill-Qwen-1.5B-GGUF",
    author: "unsloth",
    type: "model" as const,
    private: false,
    downloads: "189.2k",
    likes: 420,
    pipeline_tag: "Deep Reasoning",
    quant: "Q4_K_M",
    desc: "Chain-of-thought deep reasoning model for security auditing and git conflict analysis.",
    url: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF",
  },
  {
    id: "vikhyatk/moondream2",
    name: "moondream2",
    author: "vikhyatk",
    type: "model" as const,
    private: false,
    downloads: "382.1k",
    likes: 1250,
    pipeline_tag: "Vision / OCR",
    quant: "FP16 / Int4",
    desc: "Edge vision model: UI screenshot auditing, OCR text extraction, and artifact inspection.",
    url: "https://huggingface.co/vikhyatk/moondream2",
  },
  {
    id: "HuggingFaceTB/SmolLM2-360M-Instruct-GGUF",
    name: "SmolLM2-360M-Instruct-GGUF",
    author: "HuggingFaceTB",
    type: "model" as const,
    private: false,
    downloads: "87.4k",
    likes: 215,
    pipeline_tag: "Edge Conversational",
    quant: "Q4_K_M",
    desc: "Ultra-compact neural model with minimal memory footprint for fast edge command execution.",
    url: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF",
  },
  {
    id: "motherskitchenblr2/guardian-agent-space",
    name: "guardian-agent-space",
    author: "motherskitchenblr2",
    type: "space" as const,
    private: false,
    downloads: "12.8k",
    likes: 98,
    pipeline_tag: "Gradio WebUI",
    quant: "ZeroGPU / PyTorch",
    desc: "Interactive autonomous guardian control center and fleet monitoring dashboard.",
    url: "https://huggingface.co/spaces/motherskitchenblr2/guardian-agent-space",
  },
  {
    id: "motherskitchenblr2/security-audit-corpus",
    name: "security-audit-corpus",
    author: "motherskitchenblr2",
    type: "dataset" as const,
    private: true,
    downloads: "3.4k",
    likes: 45,
    pipeline_tag: "Evaluation Dataset",
    quant: "Parquet",
    desc: "Sanitized vulnerability scan patterns, secret detection test vectors, and AST benchmarks.",
    url: "https://huggingface.co/datasets/motherskitchenblr2/security-audit-corpus",
  },
];

const HUGGINGFACE_PRS = [
  {
    repo: "motherskitchenblr2/cyber-guardian-qwen",
    number: 4,
    title: "Add GGUF Q4_K_M quantization weights & arm64 bench",
    author: "ggml-bot",
    type: "Pull Request",
    created_at: "2026-09-27T10:14:00Z",
    url: "https://huggingface.co/motherskitchenblr2/cyber-guardian-qwen/discussions/4",
  },
  {
    repo: "motherskitchenblr2/security-audit-corpus",
    number: 2,
    title: "Parquet conversion and metadata schema update",
    author: "dataset-ops",
    type: "Pull Request",
    created_at: "2026-09-25T14:30:00Z",
    url: "https://huggingface.co/datasets/motherskitchenblr2/security-audit-corpus/discussions/2",
  },
  {
    repo: "motherskitchen/deepseek-r1-distill-space",
    number: 3,
    title: "Fix cold-boot timeout on ZeroGPU backend",
    author: "community-dev",
    type: "Discussion",
    created_at: "2026-09-28T08:22:00Z",
    url: "https://huggingface.co/spaces/motherskitchen/deepseek-r1-distill-space/discussions/3",
  },
  {
    repo: "bartowski/Llama-3.2-1B-Instruct-GGUF",
    number: 12,
    title: "ARM64 Android Termux memory optimization discussion",
    author: "termux-user",
    type: "Discussion",
    created_at: "2026-09-26T18:40:00Z",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/discussions/12",
  },
];

const HUGGINGFACE_DUPLICATES = [
  {
    name: "motherskitchen/deepseek-r1-distill-space",
    upstream: "deepseek-ai/DeepSeek-R1-Gradio",
    type: "Space (Gradio)",
    status: "Running · In Sync",
    url: "https://huggingface.co/spaces/motherskitchen/deepseek-r1-distill-space",
  },
  {
    name: "motherskitchen/moondream-demo",
    upstream: "vikhyatk/moondream2-web",
    type: "Space (Streamlit)",
    status: "Running · Up to date",
    url: "https://huggingface.co/spaces/motherskitchen/moondream-demo",
  },
  {
    name: "motherskitchen/llama-3.2-webui",
    upstream: "meta-llama/Llama-3.2-1B-Instruct",
    type: "Space (Docker)",
    status: "Sync Available (1 commit behind)",
    url: "https://huggingface.co/spaces/motherskitchen/llama-3.2-webui",
  },
];

export default function GuardianDashboard() {
  const [activeTab, setActiveTab] = useState<"office" | "repos" | "prs" | "forks" | "terminal" | "ai" | "integrations">("office");
  const [repoPlatform, setRepoPlatform] = useState<"github" | "huggingface">("github");
  const [prPlatform, setPrPlatform] = useState<"github" | "huggingface">("github");
  const [forkPlatform, setForkPlatform] = useState<"github" | "huggingface">("github");
  const [hfRepoCategory, setHfRepoCategory] = useState<"all" | "model" | "space" | "dataset">("all");
  const [repoVisibilityFilter, setRepoVisibilityFilter] = useState<"all" | "public" | "private">("all");

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);
  const [isBranchProtectionOpen, setIsBranchProtectionOpen] = useState(false);
  const [selectedProtectionRepo, setSelectedProtectionRepo] = useState<string>("");
  const [modelAssignments, setModelAssignments] = useState<ModelAssignments>(DEFAULT_MODEL_ASSIGNMENTS);

  const [stats, setStats] = useState<any>({
    account: "motherskitchenblr2",
    open_prs: 924,
    forks_count: 193,
    prs_merged: 46,
    prs_rebased: 4,
    secret_status: "CLEAN",
    hardened_count: 30,
    total_owned: 242,
    public_count: 228,
    private_count: 14,
  });

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [forks, setForks] = useState<Fork[]>([]);
  const [allRepos, setAllRepos] = useState<RepositoryItem[]>([]);
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

      // 2. Fetch Repositories (Public & Private)
      const reposRes = await fetch("/api/repos?visibility=all").catch(() => null);
      if (reposRes?.ok) {
        const reposData = await reposRes.json();
        setAllRepos(reposData.repos || []);
        setStats((prev: any) => ({
          ...prev,
          total_owned: reposData.total_count || 242,
          public_count: reposData.public_count || 228,
          private_count: reposData.private_count || 14,
        }));
      }

      // 3. Fetch PRs
      const prsRes = await fetch("/api/prs?limit=40").catch(() => null);
      if (prsRes?.ok) {
        const prsData = await prsRes.json();
        setPrs(prsData.prs || []);
      }

      // 4. Fetch Forks
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
    try {
      const stored = localStorage.getItem("guardian_model_assignments");
      if (stored) setModelAssignments(JSON.parse(stored));
    } catch {}
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

  // Filtered PRs
  const filteredPrs = prs.filter(
    (p) =>
      p.repo.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Filtered Repositories (Public vs Private)
  const filteredRepos = allRepos
    .filter((r) => {
      if (repoVisibilityFilter === "public") return !r.private;
      if (repoVisibilityFilter === "private") return r.private;
      return true;
    })
    .filter(
      (r) =>
        r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(filterQuery.toLowerCase()) ||
        r.language.toLowerCase().includes(filterQuery.toLowerCase())
    );

  // Filtered Hugging Face Repositories
  const filteredHfRepos = HUGGINGFACE_REPOS.filter((repo) => {
    const matchesCategory = hfRepoCategory === "all" || repo.type === hfRepoCategory;
    const matchesSearch =
      !filterQuery ||
      repo.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      repo.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      repo.desc.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered Hugging Face PRs & Discussions
  const filteredHfPrs = HUGGINGFACE_PRS.filter((pr) => {
    return (
      !filterQuery ||
      pr.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      pr.repo.toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  // Filtered Hugging Face Duplicates & Spaces
  const filteredHfForks = HUGGINGFACE_DUPLICATES.filter((fork) => {
    return (
      !filterQuery ||
      fork.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      fork.upstream.toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col min-h-screen pb-32 md:pb-16">
      {/* Modals */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSave={() => showToast("AI Provider Keys updated!")}
      />
      <ModelSelectorModal
        isOpen={isRouterModalOpen}
        onClose={() => setIsRouterModalOpen(false)}
        onSave={(newAssignments) => {
          setModelAssignments(newAssignments);
          showToast(`Autonomy Mode set to ${newAssignments.autonomy_mode.toUpperCase()}`);
        }}
      />
      <BranchProtectionManager
        isOpen={isBranchProtectionOpen}
        onClose={() => setIsBranchProtectionOpen(false)}
        selectedRepo={selectedProtectionRepo}
        allRepos={allRepos}
        showToast={showToast}
      />

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

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setSelectedProtectionRepo(allRepos[0]?.full_name || "motherskitchenblr2/github-guardian");
                setIsBranchProtectionOpen(true);
              }}
              className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 touch-press"
              title="Branch Protection Rules & Immutability Shield"
            >
              <Shield className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsRouterModalOpen(true)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white touch-press"
              title="Configure AI Models & Autonomy"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white touch-press"
              title="AI Provider Keys"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white touch-press"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 flex-1 space-y-5">
        {/* Metric Cards Carousel / Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          <div
            onClick={() => setActiveTab("repos")}
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-sky-500/30 transition-all touch-press"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">All Repos</span>
              <FolderGit2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.total_owned}</div>
            <div className="text-[10px] sm:text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{stats.public_count} Public</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{stats.private_count} Private</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("prs")}
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-emerald-500/30 transition-all touch-press"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">PRs Merged</span>
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">46+</div>
            <div className="text-[10px] sm:text-xs text-emerald-400/90 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Squash auto-merged
            </div>
          </div>

          <div
            onClick={() => setActiveTab("forks")}
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 transition-all touch-press"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Forks Fleet</span>
              <GitFork className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">{stats.forks_count}</div>
            <div className="text-[10px] sm:text-xs text-sky-400/90 mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Upstream origin active
            </div>
          </div>

          <div
            onClick={() => setActiveTab("ai")}
            className="glass-panel p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-pink-500/30 transition-all touch-press"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Agent Autonomy</span>
              <Bot className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-300">
              {modelAssignments.autonomy_mode === "yolo" ? "YOLO" : "GUARD"}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Multimodal Router
            </div>
          </div>
        </section>

        {/* Tab Selection Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab("office")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "office"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Office</span>
            </button>

            <button
              onClick={() => setActiveTab("repos")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "repos"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Repositories</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {stats.total_owned}
              </span>
            </button>

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
            </button>

            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "terminal"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Terminal</span>
            </button>

            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "ai"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>AI Suite</span>
            </button>

            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                activeTab === "integrations"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Accounts</span>
            </button>
          </div>
        </div>

        {/* TAB 0: EXECUTIVE OFFICE */}
        {activeTab === "office" && (
          <ExecutiveOffice
            stats={stats}
            showToast={showToast}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
          />
        )}

        {/* TAB 1: REPOSITORIES (ALL, PUBLIC, PRIVATE) */}
        {activeTab === "repos" && (
          <div className="space-y-4">
            {/* Multi-Platform Selector Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setRepoPlatform("github")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    repoPlatform === "github"
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>GitHub ({stats.total_owned})</span>
                </button>
                <button
                  onClick={() => setRepoPlatform("huggingface")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    repoPlatform === "huggingface"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hugging Face ({HUGGINGFACE_REPOS.length})</span>
                </button>
              </div>
              <button
                onClick={() => setActiveTab("integrations")}
                className="text-[11px] text-slate-400 hover:text-sky-300 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-white/5 border border-white/10"
                title="Manage platform connections"
              >
                <Plus className="w-3 h-3" />
                <span>Add Platform</span>
              </button>
            </div>

            {/* GITHUB PLATFORM VIEW */}
            {repoPlatform === "github" && (
              <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setRepoVisibilityFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    repoVisibilityFilter === "all"
                      ? "bg-white/15 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>All ({stats.total_owned})</span>
                </button>

                <button
                  onClick={() => setRepoVisibilityFilter("public")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    repoVisibilityFilter === "public"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-emerald-300"
                  }`}
                >
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Public ({stats.public_count})</span>
                </button>

                <button
                  onClick={() => setRepoVisibilityFilter("private")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    repoVisibilityFilter === "private"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Private ({stats.private_count})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Showing {filteredRepos.length} repos
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search repository by name, description, or language..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="space-y-3">
              {filteredRepos.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs sm:text-sm">
                  {loading ? "Loading repository fleet..." : "No repositories matching current filters."}
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-sky-500/30 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                        )}
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-xs sm:text-sm text-white hover:text-sky-300 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{repo.name}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {repo.private ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono uppercase">
                            Private
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold font-mono uppercase">
                            Public
                          </span>
                        )}

                        {repo.fork && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold font-mono uppercase">
                            Fork
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          {repo.language}
                        </span>

                        {repo.stars > 0 && (
                          <span className="flex items-center gap-1 text-amber-300">
                            <Star className="w-3 h-3" /> {repo.stars}
                          </span>
                        )}

                        {repo.forks > 0 && (
                          <span className="flex items-center gap-1 text-indigo-300">
                            <GitFork className="w-3 h-3" /> {repo.forks}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500">
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Dedicated Pure GitHub Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors touch-press"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>GitHub Repo</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      <button
                        onClick={() => {
                          setSelectedProtectionRepo(repo.full_name);
                          setIsBranchProtectionOpen(true);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors touch-press"
                        title="Configure Branch Protection & Immutability Rules"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Branch Shield</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab("terminal");
                          showToast(`Cyber Terminal: Target repository set to ${repo.name}`);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors touch-press sm:ml-auto"
                      >
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Work in Terminal</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* HUGGING FACE PLATFORM VIEW */}
        {repoPlatform === "huggingface" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setHfRepoCategory("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    hfRepoCategory === "all"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>All ({HUGGINGFACE_REPOS.length})</span>
                </button>

                <button
                  onClick={() => setHfRepoCategory("model")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    hfRepoCategory === "model"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Bot className="w-3 h-3 text-amber-400" />
                  <span>Models ({HUGGINGFACE_REPOS.filter((r) => r.type === "model").length})</span>
                </button>

                <button
                  onClick={() => setHfRepoCategory("space")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    hfRepoCategory === "space"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Rocket className="w-3 h-3 text-pink-400" />
                  <span>Spaces ({HUGGINGFACE_REPOS.filter((r) => r.type === "space").length})</span>
                </button>

                <button
                  onClick={() => setHfRepoCategory("dataset")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    hfRepoCategory === "dataset"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Datasets ({HUGGINGFACE_REPOS.filter((r) => r.type === "dataset").length})</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Showing {filteredHfRepos.length} Hugging Face assets
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search Hugging Face models, spaces, or datasets..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="space-y-3">
              {filteredHfRepos.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs sm:text-sm">
                  No Hugging Face assets matching filter criteria.
                </div>
              ) : (
                filteredHfRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {repo.type === "space" ? (
                          <Rocket className="w-4 h-4 text-pink-400 shrink-0" />
                        ) : repo.type === "dataset" ? (
                          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-xs sm:text-sm text-amber-300 hover:text-amber-200 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{repo.id}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-mono uppercase">
                          {repo.type}
                        </span>
                        {repo.private ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-bold font-mono uppercase">
                            Private
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono uppercase">
                            Public
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {repo.desc}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        {repo.quant || repo.pipeline_tag}
                      </span>
                      <span>{repo.downloads} downloads</span>
                      <span>{repo.likes} likes</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors touch-press"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>View on Hugging Face</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      <a
                        href={`${repo.url}/tree/main`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors touch-press"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Files & Versions</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>

                      <button
                        onClick={() => {
                          setActiveTab("terminal");
                          showToast(`Cyber Terminal: Target HF repository set to ${repo.id}`);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors touch-press sm:ml-auto"
                      >
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Work in Terminal</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    )}

        {/* TAB 2: PULL REQUESTS */}
        {activeTab === "prs" && (
          <div className="space-y-4">
            {/* Multi-Platform Selector Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setPrPlatform("github")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    prPlatform === "github"
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>GitHub PRs ({stats.open_prs})</span>
                </button>
                <button
                  onClick={() => setPrPlatform("huggingface")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    prPlatform === "huggingface"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hugging Face PRs & Discussions ({HUGGINGFACE_PRS.length})</span>
                </button>
              </div>
            </div>

            {/* GITHUB PRS VIEW */}
            {prPlatform === "github" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search PR title or repo name..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

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

                          <h3 className="text-xs sm:text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed">
                            {pr.title}
                          </h3>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                              <span>{pr.author}</span>
                            </div>
                            <span className="text-slate-500">
                              {new Date(pr.created_at).toLocaleDateString()}
                            </span>
                          </div>

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
              </div>
            )}

            {/* HUGGING FACE PRS & DISCUSSIONS VIEW */}
            {prPlatform === "huggingface" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search Hugging Face PR or discussion..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  {filteredHfPrs.length === 0 ? (
                    <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 text-xs sm:text-sm">
                      No Hugging Face PRs or discussions matching search.
                    </div>
                  ) : (
                    filteredHfPrs.map((pr) => (
                      <div
                        key={`${pr.repo}-${pr.number}`}
                        className="glass-panel p-4 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={pr.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 truncate"
                          >
                            <span className="truncate">{pr.repo}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </a>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 shrink-0">
                            {pr.type} #{pr.number}
                          </span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed">
                          {pr.title}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>{pr.author}</span>
                          </div>
                          <span className="text-slate-500">
                            {new Date(pr.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => showToast(`Accepted Hugging Face PR #${pr.number} for ${pr.repo}`)}
                            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 touch-press"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Auto-Accept</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("terminal");
                              showToast(`Cyber Terminal: Target HF PR #${pr.number} set for ${pr.repo}`);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 touch-press"
                          >
                            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Review in Terminal</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FORK SYNCHRONIZER */}
        {activeTab === "forks" && (
          <div className="space-y-4">
            {/* Multi-Platform Selector Bar */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setForkPlatform("github")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    forkPlatform === "github"
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>GitHub Forks ({stats.forks_count})</span>
                </button>
                <button
                  onClick={() => setForkPlatform("huggingface")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 touch-press transition-all ${
                    forkPlatform === "huggingface"
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25"
                      : "text-slate-400 hover:text-amber-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hugging Face Duplicates & Spaces ({HUGGINGFACE_DUPLICATES.length})</span>
                </button>
              </div>
            </div>

            {/* GITHUB FORKS VIEW */}
            {forkPlatform === "github" && (
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

            {/* HUGGING FACE DUPLICATES & SPACES VIEW */}
            {forkPlatform === "huggingface" && (
              <div className="space-y-3">
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3 mb-2">
                  <div className="text-xs text-amber-200">
                    <span className="font-bold">Hugging Face Duplicates</span> actively tracking upstream model and space repos.
                  </div>
                </div>

                {filteredHfForks.map((fork) => (
                  <div
                    key={fork.name}
                    className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={fork.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 truncate block"
                      >
                        {fork.name}
                      </a>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        upstream: <span className="text-slate-300">{fork.upstream}</span> · <span className="text-emerald-400">{fork.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => showToast(`Fast-Forward Sync initiated for HF Space ${fork.name}`)}
                        className="py-2 px-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold shrink-0 touch-press hover:bg-sky-500/25 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Fast-Forward Sync</span>
                      </button>

                      <a
                        href={fork.url}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold shrink-0 touch-press hover:bg-amber-500/25 flex items-center gap-1.5"
                      >
                        <Rocket className="w-3 h-3" />
                        <span>Open Space</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CYBER TERMINAL */}
        {activeTab === "terminal" && (
          <CyberTerminal showToast={showToast} />
        )}

        {/* TAB 5: AI SUITE */}
        {activeTab === "ai" && (
          <MultimodalAiSuite
            showToast={showToast}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            onOpenRouterModal={() => setIsRouterModalOpen(true)}
          />
        )}

        {/* TAB 6: MULTI-ACCOUNT INTEGRATIONS */}
        {activeTab === "integrations" && (
          <MultiAccountManager showToast={showToast} />
        )}
      </main>

      {/* Floating Autonomous AI Agent Chat Drawer */}
      <AgentChatDrawer
        onOpenKeys={() => setIsKeyModalOpen(true)}
        onOpenRouter={() => setIsRouterModalOpen(true)}
        autonomyMode={modelAssignments.autonomy_mode}
      />

      {/* Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around md:hidden">
        <button
          onClick={() => setActiveTab("office")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "office" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span className="text-[10px]">Office</span>
        </button>

        <button
          onClick={() => setActiveTab("repos")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "repos" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span className="text-[10px]">Repos</span>
        </button>

        <button
          onClick={() => setActiveTab("prs")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "prs" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          <span className="text-[10px]">PRs</span>
        </button>

        <button
          onClick={() => setActiveTab("forks")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "forks" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span className="text-[10px]">Forks</span>
        </button>

        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "terminal" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span className="text-[10px]">Terminal</span>
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "ai" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px]">AI Suite</span>
        </button>

        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex flex-col items-center gap-1 touch-press ${
            activeTab === "integrations" ? "text-sky-400 font-semibold" : "text-slate-400"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="text-[10px]">Accounts</span>
        </button>
      </nav>
    </div>
  );
}
