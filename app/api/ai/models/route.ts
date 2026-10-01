import { NextRequest, NextResponse } from "next/server";
import { CATALOG_MODELS, callAIModel } from "@/lib/ai/providers";
import { DEFAULT_MODEL_ASSIGNMENTS } from "@/lib/ai/router";
import fs from "fs";
import path from "path";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Inspect disk manifests if Ollama process was offline
function getDiskInstalledModels(): any[] {
  const manifestsDir = "/data/data/com.termux/files/home/.ollama/models/manifests";
  const results: any[] = [];

  try {
    if (fs.existsSync(manifestsDir)) {
      function scanDir(dir: string, base: string = "") {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = base ? `${base}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            scanDir(fullPath, relPath);
          } else if (entry.isFile()) {
            // Found a model manifest
            let modelTag = relPath.replace(/^registry\.ollama\.ai\/library\//, "");
            modelTag = modelTag.replace(/^hf\.co\//, "");
            let size = 0;
            try {
              const stat = fs.statSync(fullPath);
              size = stat.size;
            } catch {}

            results.push({
              name: modelTag.replace(/\/([^\/]+)$/, ":$1"),
              model: modelTag.replace(/\/([^\/]+)$/, ":$1"),
              size_formatted: "Pre-installed GGUF",
              source: "disk_manifest",
            });
          }
        }
      }
      scanDir(manifestsDir);
    }
  } catch {}

  return results;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");
  const openrouterKey = url.searchParams.get("key") || process.env.OPENROUTER_API_KEY;

  // Handle direct OpenRouter models query
  if (provider === "openrouter") {
    try {
      const headers: Record<string, string> = {
        "HTTP-Referer": "https://github-guardian.vercel.app",
        "X-Title": "GitHub Guardian",
      };
      if (openrouterKey) {
        headers["Authorization"] = `Bearer ${openrouterKey}`;
      }
      const orRes = await fetch("https://openrouter.ai/api/v1/models", {
        headers,
      });
      if (orRes.ok) {
        const json = await orRes.json();
        const raw = Array.isArray(json.data) ? json.data : [];
        if (raw.length > 0) {
          const models = raw.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: "openrouter",
            context_length: m.context_length || 32768,
            is_free: m.id.endsWith(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0"),
            pricing_prompt: m.pricing?.prompt || "0",
            pricing_completion: m.pricing?.completion || "0",
            description: m.description || "",
            category: m.id.includes("coder") ? "coding" : (m.id.includes("r1") || m.id.includes("reasoning") || m.id.includes("qwq")) ? "reasoning" : (m.id.includes("flash") || m.id.includes("instant")) ? "fast" : "chat",
          }));
          return NextResponse.json({
            provider: "openrouter",
            models,
            total: models.length,
          });
        }
      }
    } catch {
      // Remote OpenRouter failed, fall back to curated models
    }

    const curated = CATALOG_MODELS.filter((m) => m.provider === "openrouter").map((m) => ({
      id: m.id,
      name: m.name,
      provider: "openrouter",
      context_length: m.context_length,
      is_free: m.is_free,
      pricing_prompt: "0",
      pricing_completion: "0",
      description: `${m.name} free cloud endpoint via OpenRouter.`,
      category: m.category,
    }));
    return NextResponse.json({
      provider: "openrouter",
      models: curated,
      total: curated.length,
    });
  }

  let ollamaOnline = false;
  let installedOllamaModels: any[] = [];

  // 1. Probe local Ollama server
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("http://127.0.0.1:11434/api/tags", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        ollamaOnline = true;
        installedOllamaModels = data.models.map((m: any) => ({
          name: m.name,
          model: m.model,
          size: m.size,
          size_formatted: formatBytes(m.size),
          quant: m.details?.quantization_level || "GGUF Q4_K_M",
          family: m.details?.family || "quantized",
          parameter_size: m.details?.parameter_size || "",
          context_length: m.details?.context_length || 32768,
          capabilities: m.capabilities || ["completion"],
          modified_at: m.modified_at,
          is_installed: true,
        }));
      }
    }
  } catch {
    // Ollama daemon not responding to HTTP
  }

  // 2. If HTTP probe returned empty, fallback to local disk manifests
  if (installedOllamaModels.length === 0) {
    const diskModels = getDiskInstalledModels();
    if (diskModels.length > 0) {
      installedOllamaModels = diskModels.map((m) => ({
        ...m,
        quant: "GGUF Q4_K_M",
        is_installed: true,
      }));
    }
  }

  return NextResponse.json({
    models: CATALOG_MODELS,
    assignments: DEFAULT_MODEL_ASSIGNMENTS,
    ollama_online: ollamaOnline,
    installed_models: installedOllamaModels,
    installed_count: installedOllamaModels.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, model = "qwen2.5-coder:1.5b", prompt, customKeys = {} } = body;

    // Test quick inference against installed Ollama model or Cloud AI
    if (action === "test_inference") {
      const testPrompt = prompt || "Explain how GitHub branch protection prevents git force push in 1 concise sentence.";

      // 1. Try local Ollama first if accessible
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            prompt: testPrompt,
            stream: false,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 200) {
          const data = await res.json();
          return NextResponse.json({
            success: true,
            model,
            response: data.response?.trim(),
            total_duration_ms: Math.round((data.total_duration || 0) / 1000000),
            source: "ollama",
          });
        }
      } catch {
        // Local Ollama unavailable (e.g. deployed on Vercel) -> seamlessly fall back to Cloud AI
      }

      // 2. Fallback to Cloud AI Model via callAIModel
      try {
        const start = Date.now();
        const aiRes = await callAIModel(model, [{ role: "user", content: testPrompt }], customKeys);
        return NextResponse.json({
          success: true,
          model: aiRes.modelUsed || model,
          response: aiRes.text?.trim() || "Inference response generated.",
          total_duration_ms: Date.now() - start,
          source: "cloud",
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 502 });
      }
    }

    // Pull model
    if (action === "pull") {
      try {
        const res = await fetch("http://127.0.0.1:11434/api/pull", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: model, stream: false }),
        });
        const data = await res.json();
        return NextResponse.json({ success: res.status === 200, data });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 502 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
