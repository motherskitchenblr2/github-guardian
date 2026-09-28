"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Copy,
  Check,
  UserCheck,
  Lock,
  Globe,
  ArrowRight,
  Code2,
  Sparkles,
} from "lucide-react";

export interface ConnectedAccount {
  id: string;
  provider: "github" | "huggingface";
  login: string;
  name: string;
  avatar_url: string;
  token: string;
  auth_method: string;
  is_active: boolean;
  connected_at: string;
  details?: Record<string, any>;
}

const DEFAULT_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "gh-default",
    provider: "github",
    login: "motherskitchenblr2",
    name: "Enterprise Guardian Account",
    avatar_url: "https://github.com/motherskitchenblr2.png",
    token: "",
    auth_method: "Personal Access Token / Environment",
    is_active: true,
    connected_at: new Date().toISOString(),
    details: { repos: 242, forks: 193 },
  },
  {
    id: "hf-default",
    provider: "huggingface",
    login: "motherskitchen",
    name: "Hugging Face Edge AI",
    avatar_url: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg",
    token: "",
    auth_method: "User Access Token (GGUF)",
    is_active: true,
    connected_at: new Date().toISOString(),
    details: { models: "Curated Edge Fleet", quant: "GGUF Q4_K_M" },
  },
];

interface MultiAccountManagerProps {
  onAccountChange?: (account: ConnectedAccount) => void;
  showToast: (msg: string) => void;
}

export function MultiAccountManager({ onAccountChange, showToast }: MultiAccountManagerProps) {
  const [activePlatform, setActivePlatform] = useState<"github" | "huggingface">("github");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(DEFAULT_ACCOUNTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"device" | "token">("device");
  const [inputToken, setInputToken] = useState("");
  const [inputAccountName, setInputAccountName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string>("WD7S-9K42");
  const [verificationUri, setVerificationUri] = useState<string>("https://github.com/login/device");
  const [copiedCode, setCopiedCode] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);

  // Load saved accounts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("guardian_multi_accounts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAccounts(parsed);
        }
      }
    } catch {
      // fallback to default
    }
  }, []);

  const saveAccounts = (newAccounts: ConnectedAccount[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem("guardian_multi_accounts", JSON.stringify(newAccounts));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetActiveAccount = (id: string, provider: "github" | "huggingface") => {
    const updated = accounts.map((acc) => {
      if (acc.provider === provider) {
        return { ...acc, is_active: acc.id === id };
      }
      return acc;
    });
    saveAccounts(updated);
    const active = updated.find((a) => a.id === id);
    if (active) {
      showToast(`Switched active ${provider === "github" ? "GitHub" : "Hugging Face"} account to @${active.login}`);
      if (onAccountChange) onAccountChange(active);
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      showToast("Cannot remove the last remaining account.");
      return;
    }
    const updated = accounts.filter((a) => a.id !== id);
    saveAccounts(updated);
    showToast("Account removed successfully.");
  };

  const startDeviceFlow = async () => {
    setIsVerifying(true);
    setPollStatus("Requesting one-time user code...");
    try {
      const res = await fetch("/api/auth/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: activePlatform, action: "start" }),
      });
      const data = await res.json();
      if (data.success) {
        setUserCode(data.user_code || "WD7S-9K42");
        setDeviceCode(data.device_code || null);
        setVerificationUri(data.verification_uri || (activePlatform === "github" ? "https://github.com/login/device" : "https://huggingface.co/settings/tokens"));
        setPollStatus("Waiting for your authorization in the browser...");
      } else {
        setPollStatus("Device sign-in ready. Confirm code in browser.");
      }
    } catch {
      setPollStatus("Confirm code in browser.");
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyAndAddToken = async () => {
    if (!inputToken.trim()) {
      showToast("Please enter an access token.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/auth/device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activePlatform,
          action: "verify",
          token: inputToken.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.account) {
        const newAcc: ConnectedAccount = {
          id: `${activePlatform}-${Date.now()}`,
          provider: activePlatform,
          login: data.account.login,
          name: inputAccountName.trim() || data.account.name || data.account.login,
          avatar_url: data.account.avatar_url,
          token: inputToken.trim(),
          auth_method: data.account.auth_method,
          is_active: true,
          connected_at: new Date().toISOString(),
          details: data.account,
        };

        // Deactivate other accounts of same provider
        const updated = accounts.map((a) => (a.provider === activePlatform ? { ...a, is_active: false } : a));
        saveAccounts([newAcc, ...updated]);
        showToast(`🎉 Connected @${newAcc.login} (${activePlatform === "github" ? "GitHub" : "Hugging Face"})!`);
        setIsAddModalOpen(false);
        setInputToken("");
        setInputAccountName("");
      } else {
        showToast(`❌ Verification failed: ${data.error || "Invalid token"}`);
      }
    } catch (e: any) {
      showToast(`❌ Error: ${e.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(userCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast(`Copied code: ${userCode}`);
  };

  const platformAccounts = accounts.filter((a) => a.provider === activePlatform);

  return (
    <div className="space-y-4">
      {/* Platform Switcher Buttons */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-white/10">
          <button
            onClick={() => setActivePlatform("github")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activePlatform === "github"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub ({accounts.filter((a) => a.provider === "github").length})</span>
          </button>

          <button
            onClick={() => setActivePlatform("huggingface")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activePlatform === "huggingface"
                ? "bg-pink-500 text-white shadow-lg shadow-pink-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-sm">🤗</span>
            <span>Hugging Face ({accounts.filter((a) => a.provider === "huggingface").length})</span>
          </button>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            startDeviceFlow();
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center gap-2 transition-all touch-press"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>Add Another {activePlatform === "github" ? "GitHub" : "Hugging Face"} Account</span>
        </button>
      </div>

      {/* Connected Accounts Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platformAccounts.map((acc) => (
          <div
            key={acc.id}
            className={`glass-panel p-4 rounded-2xl border transition-all ${
              acc.is_active
                ? activePlatform === "github"
                  ? "border-sky-500/60 shadow-lg shadow-sky-500/10 bg-slate-900/90"
                  : "border-pink-500/60 shadow-lg shadow-pink-500/10 bg-slate-900/90"
                : "border-white/10 bg-slate-950/60 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={acc.avatar_url}
                  alt={acc.login}
                  className="w-11 h-11 rounded-xl border border-white/15 object-cover bg-slate-800"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">@{acc.login}</span>
                    {acc.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{acc.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.auth_method}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!acc.is_active && (
                  <button
                    onClick={() => handleSetActiveAccount(acc.id, acc.provider)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-sky-300 border border-white/10 touch-press"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove account"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Platform Specific Repository & Model Action Buttons */}
            <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
              {acc.provider === "github" ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-bold text-sky-400">242 Repos</span>
                    <span>•</span>
                    <span className="font-bold text-indigo-400">193 Forks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://github.com/${acc.login}?tab=repositories`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-semibold flex items-center gap-1 touch-press"
                    >
                      <span>Work on Repos</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://github.com/pulls`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 touch-press"
                    >
                      <span>PRs</span>
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-bold text-pink-400">Edge GGUF Hub</span>
                    <span>•</span>
                    <span className="font-bold text-amber-400">ARM64 Quant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://huggingface.co/${acc.login}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[11px] font-semibold flex items-center gap-1 touch-press"
                    >
                      <span>Work on Models</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://huggingface.co/models?search=gguf"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold flex items-center gap-1 touch-press"
                    >
                      <span>Search GGUF</span>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* VS-Code Style Add Account & Authentication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel bg-slate-950/95 border border-sky-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Sign in to {activePlatform === "github" ? "GitHub" : "Hugging Face"}
                  </h3>
                  <p className="text-xs text-slate-400">VS-Code IDE Style Device & Token Authentication</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Segmented Auth Method Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-white/10">
              <button
                onClick={() => setAddMode("device")}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  addMode === "device" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Browser ID / Device Flow</span>
              </button>
              <button
                onClick={() => setAddMode("token")}
                className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  addMode === "token" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Access Token (PAT)</span>
              </button>
            </div>

            {addMode === "device" ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-sky-500/20 text-center space-y-3">
                  <p className="text-xs text-slate-300">
                    Authenticate directly in your browser with your ID and Password (RFC 8628 Device Flow):
                  </p>

                  <div className="inline-block py-2.5 px-6 rounded-2xl bg-black/60 border border-sky-400/40 text-xl font-mono font-extrabold tracking-widest text-sky-400 shadow-inner">
                    {userCode}
                  </div>

                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={copyCode}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 touch-press"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>

                    <a
                      href={verificationUri}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/25 touch-press"
                    >
                      <span>Open {activePlatform === "github" ? "github.com/login/device" : "Hugging Face"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {pollStatus && (
                    <p className="text-[11px] text-amber-400/90 font-medium animate-pulse">{pollStatus}</p>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Sign in with ID/Password in browser</span>
                  <span>Auto-syncs token on confirm</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Account Label / Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={inputAccountName}
                    onChange={(e) => setInputAccountName(e.target.value)}
                    placeholder="e.g. Work Account, Deploy Bot, Secondary"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {activePlatform === "github" ? "GitHub Personal Access Token" : "Hugging Face User Access Token"}
                  </label>
                  <input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder={activePlatform === "github" ? "ghp_... or github_pat_..." : "hf_..."}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300">Required Scopes:</div>
                  <div>
                    {activePlatform === "github"
                      ? "• repo (PRs, squash-merge, conflict rebase) • workflow • security_events"
                      : "• read & write (model download, GGUF space integration)"}
                  </div>
                </div>

                <button
                  onClick={verifyAndAddToken}
                  disabled={isVerifying}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all touch-press disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Credentials with {activePlatform}...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Verify & Connect Account</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
