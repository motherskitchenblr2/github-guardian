"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  Zap,
  Info,
  RefreshCw,
  ExternalLink,
  Sliders,
  Check,
  X,
  FileCode2,
} from "lucide-react";
import {
  BranchProtectionRules,
  RECOMMENDED_GUARDIAN_RULES,
  STRICT_ENTERPRISE_RULES,
} from "@/lib/security/branch-protection";

interface BranchProtectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRepo?: string;
  allRepos?: Array<{ full_name: string; name: string }>;
  showToast: (msg: string) => void;
}

export function BranchProtectionManager({
  isOpen,
  onClose,
  selectedRepo: initialRepo,
  allRepos = [],
  showToast,
}: BranchProtectionManagerProps) {
  const [repo, setRepo] = useState<string>(initialRepo || (allRepos[0]?.full_name || "motherskitchenblr2/github-guardian"));
  const [branch, setBranch] = useState<string>("main");
  const [isProtected, setIsProtected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRationale, setAiRationale] = useState<string[] | null>(null);
  const [aiVerdict, setAiVerdict] = useState<string | null>(null);

  const [rules, setRules] = useState<BranchProtectionRules>(RECOMMENDED_GUARDIAN_RULES);

  useEffect(() => {
    if (initialRepo) {
      setRepo(initialRepo);
    }
  }, [initialRepo]);

  useEffect(() => {
    if (isOpen && repo) {
      loadBranchProtection();
    }
  }, [isOpen, repo, branch]);

  const loadBranchProtection = async () => {
    setLoading(true);
    setAiRationale(null);
    setAiVerdict(null);
    try {
      const res = await fetch(`/api/branch-protection?repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`);
      const data = await res.json();
      if (data.is_protected && data.rules) {
        setIsProtected(true);
        setRules(data.rules);
      } else {
        setIsProtected(false);
        // Default to recommended rules
        setRules(RECOMMENDED_GUARDIAN_RULES);
      }
    } catch {
      setIsProtected(false);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: "recommended" | "strict" | "custom") => {
    if (preset === "recommended") {
      setRules(RECOMMENDED_GUARDIAN_RULES);
      showToast("Applied 'Guardian Recommended' branch protection policy!");
    } else if (preset === "strict") {
      setRules(STRICT_ENTERPRISE_RULES);
      showToast("Applied 'Strict Enterprise' Zero-Trust policy!");
    }
  };

  const askAiForRecommendation = async () => {
    setAiAnalyzing(true);
    try {
      const res = await fetch("/api/branch-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo,
          branch,
          action: "ai_recommend",
          preset: rules.requireCodeOwner ? "strict" : "recommended",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.recommended_rules);
        setAiRationale(data.rationale);
        setAiVerdict(data.ai_verdict);
        showToast("🤖 AI Architecture Model generated recommended policy!");
      }
    } catch (e: any) {
      showToast(`AI analysis error: ${e.message}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const saveBranchProtection = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/branch-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo,
          branch,
          action: "apply",
          rules,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsProtected(true);
        showToast(`🛡️ ${data.message}`);
        onClose();
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`❌ Network error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-sky-500/30 w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">Branch Protection Rules</h2>
                {isProtected ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PROTECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> UNPROTECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Safeguard code from forced pushes, unauthorized deletions, and unverified merges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Repository & Branch Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Target Repository
            </label>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo"
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Protected Branch
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
              />
              <button
                onClick={loadBranchProtection}
                disabled={loading}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 touch-press"
                title="Refresh Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Policy Presets & AI Generator */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => applyPreset("recommended")}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-sky-300 hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-sky-400" />
              <span>Recommended Shield</span>
            </button>
            <button
              onClick={() => applyPreset("strict")}
              className="px-3 py-1 rounded-lg text-xs font-semibold text-emerald-300 hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Strict Enterprise</span>
            </button>
          </div>

          <button
            onClick={askAiForRecommendation}
            disabled={aiAnalyzing}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 text-pink-300 text-xs font-bold flex items-center gap-1.5 transition-all touch-press disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-pink-400 ${aiAnalyzing ? "animate-spin" : ""}`} />
            <span>{aiAnalyzing ? "AI Auditing Repo..." : "Ask AI to Recommend"}</span>
          </button>
        </div>

        {/* AI Rationale Box */}
        {aiRationale && (
          <div className="p-3.5 bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-xl space-y-2 text-xs animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{aiVerdict || "AI DevSecOps Assessment"}</span>
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px] list-none">
              {aiRationale.map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Checkbox Rule Matrix */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Branch Protection Rules (GitHub Framework)
          </div>

          <div className="space-y-2.5">
            {/* 1. Pull Request Reviews */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.requirePullRequests}
                  onChange={(e) => setRules({ ...rules, requirePullRequests: e.target.checked })}
                  className="mt-1 rounded bg-slate-800 border-white/20 text-sky-500 focus:ring-0 focus:ring-offset-0"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Require a pull request before merging</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300">
                      (Recommended)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ensures direct commits to '{branch}' are blocked. All changes must be proposed via pull request.
                  </p>
                </div>
              </label>

              {rules.requirePullRequests && (
                <div className="pl-6 space-y-2 pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Required approving reviews:</span>
                    <select
                      value={rules.reviewCount}
                      onChange={(e) => setRules({ ...rules, reviewCount: parseInt(e.target.value) })}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      <option value={1}>1 approval (Standard)</option>
                      <option value={2}>2 approvals (Enterprise)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={rules.dismissStale}
                      onChange={(e) => setRules({ ...rules, dismissStale: e.target.checked })}
                      className="rounded bg-slate-800 border-white/20 text-sky-500"
                    />
                    <span className="text-slate-300">
                      Dismiss stale pull request approvals when new commits are pushed <span className="text-sky-400 font-bold">(Recommended)</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={rules.requireCodeOwner}
                      onChange={(e) => setRules({ ...rules, requireCodeOwner: e.target.checked })}
                      className="rounded bg-slate-800 border-white/20 text-sky-500"
                    />
                    <span className="text-slate-300">Require review from CODEOWNERS</span>
                  </label>
                </div>
              )}
            </div>

            {/* 2. Enforce for Administrators */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.enforceAdmins}
                  onChange={(e) => setRules({ ...rules, enforceAdmins: e.target.checked })}
                  className="mt-1 rounded bg-slate-800 border-white/20 text-sky-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Do not allow bypassing the above settings (Enforce for Administrators)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300">
                      (Recommended)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mandatory for continuous compliance (SOC2/ISO 27001). Guarantees even repository owners cannot bypass review policies.
                  </p>
                </div>
              </label>
            </div>

            {/* 3. Block Force Pushes */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!rules.allowForcePushes}
                  onChange={(e) => setRules({ ...rules, allowForcePushes: !e.target.checked })}
                  className="mt-1 rounded bg-slate-800 border-white/20 text-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>Block force pushes (Do not allow force pushes)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                      (Recommended &amp; Essential)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Prevents <code className="text-emerald-400">git push --force</code>. Guarantees Git commit history is permanent and can never be rewritten or erased by automated scripts.
                  </p>
                </div>
              </label>
            </div>

            {/* 4. Block Deletions */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!rules.allowDeletions}
                  onChange={(e) => setRules({ ...rules, allowDeletions: !e.target.checked })}
                  className="mt-1 rounded bg-slate-800 border-white/20 text-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>Block deletions (Do not allow deletions)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                      (Recommended &amp; Essential)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Protects the '{branch}' branch from being deleted via API, CLI, or web interface.
                  </p>
                </div>
              </label>
            </div>

            {/* 5. Required Linear History */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.requiredLinearHistory}
                  onChange={(e) => setRules({ ...rules, requiredLinearHistory: e.target.checked })}
                  className="mt-1 rounded bg-slate-800 border-white/20 text-sky-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Require linear history</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300">
                      (Recommended)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Requires squash or rebase merges to prevent recursive merge commits and preserve clean bisectability.
                  </p>
                </div>
              </label>
            </div>

            {/* 6. Conversation Resolution */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.requiredConversationResolution}
                  onChange={(e) => setRules({ ...rules, requiredConversationResolution: e.target.checked })}
                  className="mt-1 rounded bg-slate-800 border-white/20 text-sky-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Require conversation resolution before merging</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300">
                      (Recommended)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Requires all comments and reviews on pull requests to be resolved before code can be merged into '{branch}'.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Trust GitHub Protection Rules</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveBranchProtection}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all touch-press disabled:opacity-50"
            >
              <ShieldCheck className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
              <span>{saving ? "Applying to GitHub..." : "Enforce Branch Protection"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
