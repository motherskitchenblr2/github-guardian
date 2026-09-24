#!/usr/bin/env python3
"""
GitHub Guardian - Autonomous Agentic AI Engine & Model Aggregator.
Zero-dependency multimodal AI router supporting:
- Local Ollama (0.5B - 4B quantized models: Qwen2.5-Coder, DeepSeek-R1, SmolLM2, LLaMA-3.2)
- Free Cloud Providers: OpenRouter, Google AI Studio, Groq, NVIDIA NIM
- Hardware Capacity Advisor (CPU, RAM, Disk, Architecture)
- Autonomous Agentic Tool Execution (PR reviews, fork syncs, secret scans, hardening, git)
- Autonomy Modes: YOLO, Ask on Important, Always Ask
"""

import os
import re
import json
import time
import shutil
import platform
import subprocess
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional, Tuple

CONFIG_DIR = os.path.expanduser("~/.config/github-guardian")
CONFIG_FILE = os.path.join(CONFIG_DIR, "ai_config.json")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_ai_config() -> Dict[str, Any]:
    os.makedirs(CONFIG_DIR, exist_ok=True)
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "keys": {
            "google_ai_studio": os.environ.get("GEMINI_API_KEY", ""),
            "groq": os.environ.get("GROQ_API_KEY", ""),
            "openrouter": os.environ.get("OPENROUTER_API_KEY", ""),
            "nvidia": os.environ.get("NVIDIA_API_KEY", ""),
            "ollama_host": os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
        },
        "model_assignments": {
            "chat_model": "auto",
            "reasoning_model": "deepseek-r1",
            "coding_model": "qwen2.5-coder",
            "moe_model": "mixtral-8x7b",
        },
        "autonomy_mode": "yolo", # "yolo", "ask_important", "always_ask"
        "preferred_provider": "auto",
    }


def save_ai_config(cfg: Dict[str, Any]) -> bool:
    try:
        os.makedirs(CONFIG_DIR, exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
        return True
    except Exception as e:
        print(f"[Error saving AI config]: {e}")
        return False


def scan_hardware() -> Dict[str, Any]:
    """Scans device hardware capacity and recommends suitable local offline models."""
    # Cores & Architecture
    cores = os.cpu_count() or 4
    arch = platform.machine() or "unknown"
    system_name = platform.system()

    # Memory info (Linux / Android /proc/meminfo)
    mem_total_mb = 0
    mem_avail_mb = 0
    if os.path.exists("/proc/meminfo"):
        try:
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    if line.startswith("MemTotal:"):
                        mem_total_mb = int(line.split()[1]) // 1024
                    elif line.startswith("MemAvailable:"):
                        mem_avail_mb = int(line.split()[1]) // 1024
        except Exception:
            pass

    # Storage
    free_storage_gb = 0
    try:
        usage = shutil.disk_usage(BASE_DIR)
        free_storage_gb = round(usage.free / (1024 ** 3), 1)
    except Exception:
        pass

    # Check Ollama status & local models
    ollama_path = shutil.which("ollama")
    ollama_installed = ollama_path is not None
    ollama_running = False
    local_models = []

    try:
        req = urllib.request.Request("http://localhost:11434/api/tags", headers={"User-Agent": "GitHubGuardian"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            if resp.status == 200:
                ollama_running = True
                data = json.loads(resp.read().decode("utf-8"))
                for m in data.get("models", []):
                    local_models.append({
                        "name": m.get("name"),
                        "size_mb": round(m.get("size", 0) / (1024 * 1024), 1),
                        "modified_at": m.get("modified_at")
                    })
    except Exception:
        pass

    # Model recommendations based on available RAM
    recommendations = []
    if mem_avail_mb < 2000:
        tier = "Ultra-Light (0.5B - 1B)"
        recommendations = [
            {"model": "qwen2.5-coder:0.5b", "size": "390MB", "category": "coding", "desc": "Fastest syntax patches & conflict edits on mobile"},
            {"model": "smollm2:360m", "size": "230MB", "category": "chat", "desc": "Minimal RAM overhead conversational assistant"},
            {"model": "llama3.2:1b", "size": "1.3GB", "category": "chat", "desc": "Compact instruction follower"}
        ]
    elif mem_avail_mb < 4000:
        tier = "Compact (1.5B - 3B)"
        recommendations = [
            {"model": "qwen2.5-coder:1.5b", "size": "986MB", "category": "coding", "recommended": True, "desc": "Supreme code snippet, patch, and conflict rectifier"},
            {"model": "deepseek-r1:1.5b", "size": "1.1GB", "category": "reasoning", "desc": "Reasoning model for PR conflict analysis and logic trees"},
            {"model": "llama3.2:3b", "size": "2.0GB", "category": "chat", "desc": "General assistant with strong comprehension"},
        ]
    else:
        tier = "Performance (3B - 7B)"
        recommendations = [
            {"model": "qwen2.5-coder:7b", "size": "4.7GB", "category": "coding", "desc": "Full-power coding agent"},
            {"model": "deepseek-r1:7b", "size": "4.7GB", "category": "reasoning", "desc": "Deep reasoning & architecture analysis"},
            {"model": "qwen2.5-coder:1.5b", "size": "986MB", "category": "coding", "recommended": True, "desc": "High efficiency mobile fallback"}
        ]

    return {
        "hardware": {
            "cores": cores,
            "architecture": arch,
            "system": system_name,
            "mem_total_mb": mem_total_mb,
            "mem_available_mb": mem_avail_mb,
            "free_storage_gb": free_storage_gb,
            "tier": tier,
        },
        "ollama": {
            "installed": ollama_installed,
            "running": ollama_running,
            "binary_path": ollama_path,
            "installed_models": local_models
        },
        "recommended_models": recommendations
    }


def call_llm_api(
    prompt: str,
    system_prompt: str,
    provider: str = "auto",
    model: str = "auto",
    history: Optional[List[Dict[str, str]]] = None
) -> Tuple[str, str, Optional[str]]:
    """
    Sends request to specified provider or auto-routes.
    Returns: (reply_text, provider_used, model_used)
    """
    cfg = load_ai_config()
    keys = cfg.get("keys", {})

    # Determine provider & model
    if provider == "auto" or not provider:
        if keys.get("groq"):
            provider = "groq"
            model = model if model != "auto" else "llama-3.3-70b-versatile"
        elif keys.get("google_ai_studio"):
            provider = "google_ai_studio"
            model = model if model != "auto" else "gemini-2.0-flash"
        elif keys.get("openrouter"):
            provider = "openrouter"
            model = model if model != "auto" else "deepseek/deepseek-r1:free"
        elif keys.get("nvidia"):
            provider = "nvidia"
            model = model if model != "auto" else "meta/llama-3.3-70b-instruct"
        else:
            provider = "ollama"
            model = model if model != "auto" else "qwen2.5-coder:1.5b"

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages.append({"role": "user", "content": prompt})

    # Dispatch to appropriate provider
    try:
        if provider == "groq":
            api_key = keys.get("groq", "")
            if not api_key:
                raise ValueError("Groq API key not configured")
            payload = json.dumps({
                "model": model or "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 1500
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"], "Groq", model

        elif provider == "google_ai_studio":
            api_key = keys.get("google_ai_studio", "")
            if not api_key:
                raise ValueError("Google AI Studio API key not configured")
            gemini_model = model if model and model != "auto" else "gemini-2.0-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}"
            
            # Convert messages to Gemini format
            contents = []
            for m in messages:
                if m["role"] == "system":
                    continue
                role = "user" if m["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": m["content"]}]})
            
            payload = json.dumps({
                "contents": contents,
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1500}
            }).encode("utf-8")

            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                reply = data["candidates"][0]["content"]["parts"][0]["text"]
                return reply, "Google AI Studio", gemini_model

        elif provider == "openrouter":
            api_key = keys.get("openrouter", "")
            if not api_key:
                raise ValueError("OpenRouter API key not configured")
            payload = json.dumps({
                "model": model or "meta-llama/llama-3.3-70b-instruct:free",
                "messages": messages,
                "temperature": 0.3,
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/motherskitchenblr2/github-guardian",
                    "X-Title": "GitHub Guardian Agent"
                }
            )
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"], "OpenRouter", model

        elif provider == "nvidia":
            api_key = keys.get("nvidia", "")
            if not api_key:
                raise ValueError("NVIDIA API key not configured")
            payload = json.dumps({
                "model": model or "meta/llama-3.3-70b-instruct",
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1500
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                data=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"], "NVIDIA NIM", model

        elif provider == "ollama":
            host = keys.get("ollama_host", "http://localhost:11434").rstrip("/")
            ollama_model = model if model and model != "auto" else "qwen2.5-coder:1.5b"
            payload = json.dumps({
                "model": ollama_model,
                "messages": messages,
                "stream": False
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{host}/api/chat",
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=40) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["message"]["content"], "Ollama Local", ollama_model

        else:
            return f"Provider '{provider}' not implemented yet.", "System", "none"

    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")
        return f"API Error from {provider} (HTTP {e.code}): {err_msg}", provider, model
    except Exception as e:
        return f"Request failed: {str(e)}", provider, model


def execute_agent_tool(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Autonomous tool runner for GitHub Guardian."""
    guardian_py = os.path.join(BASE_DIR, "guardian.py")
    
    if tool_name == "review_prs":
        limit = args.get("limit", 25)
        res = subprocess.run(["python3", guardian_py, "review-prs", "--limit", str(limit)], capture_output=True, text=True)
        return {"tool": tool_name, "success": res.returncode == 0, "output": res.stdout[-800:]}

    elif tool_name == "sync_forks":
        limit = args.get("limit", 30)
        res = subprocess.run(["python3", guardian_py, "sync-forks", "--limit", str(limit)], capture_output=True, text=True)
        return {"tool": tool_name, "success": res.returncode == 0, "output": res.stdout[-800:]}

    elif tool_name == "scan_secrets":
        limit = args.get("limit", 20)
        res = subprocess.run(["python3", guardian_py, "scan-secrets", "--limit", str(limit)], capture_output=True, text=True)
        return {"tool": tool_name, "success": res.returncode == 0, "output": res.stdout[-800:]}

    elif tool_name == "harden_security":
        limit = args.get("limit", 25)
        res = subprocess.run(["python3", guardian_py, "harden", "--limit", str(limit)], capture_output=True, text=True)
        return {"tool": tool_name, "success": res.returncode == 0, "output": res.stdout[-800:]}

    elif tool_name == "run_all_maintenance":
        res = subprocess.run(["python3", guardian_py, "run-all"], capture_output=True, text=True)
        return {"tool": tool_name, "success": res.returncode == 0, "output": res.stdout[-800:]}

    elif tool_name == "scan_hardware":
        return {"tool": tool_name, "success": True, "result": scan_hardware()}

    elif tool_name == "pull_ollama_model":
        model_name = args.get("model", "qwen2.5-coder:1.5b")
        cmd = ["ollama", "pull", model_name]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            return {"tool": tool_name, "success": res.returncode == 0, "output": res.stdout + res.stderr}
        except Exception as e:
            return {"tool": tool_name, "success": False, "error": str(e)}

    return {"tool": tool_name, "success": False, "error": f"Unknown tool: {tool_name}"}


def detect_tool_intent(prompt: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    """Rule-based tool detector if LLM doesn't call structured json."""
    p = prompt.lower()
    if any(k in p for k in ["review pr", "merge pr", "check pr", "pull request", "auto merge"]):
        return "review_prs", {"limit": 25}
    if any(k in p for k in ["sync fork", "sync upstream", "update fork"]):
        return "sync_forks", {"limit": 30}
    if any(k in p for k in ["scan secret", "check secret", "token leak", "leaked"]):
        return "scan_secrets", {"limit": 20}
    if any(k in p for k in ["harden", "security harden", "dependabot", "vulnerability"]):
        return "harden_security", {"limit": 25}
    if any(k in p for k in ["run all", "full maintenance", "daily run"]):
        return "run_all_maintenance", {}
    if any(k in p for k in ["hardware", "scan device", "device ram", "memory", "specs"]):
        return "scan_hardware", {}
    if "pull " in p and ("ollama" in p or "qwen" in p or "deepseek" in p or "llama" in p):
        m = re.search(r"pull\s+([a-zA-Z0-9\.\-\:]+)", p)
        model = m.group(1) if m else "qwen2.5-coder:1.5b"
        return "pull_ollama_model", {"model": model}
    return None
