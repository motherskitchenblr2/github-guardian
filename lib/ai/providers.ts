/**
 * Unified Multimodal Multi-Provider AI Engine for GitHub Guardian.
 * Supports: OpenRouter (free tier), Google AI Studio (Gemini), Groq, NVIDIA NIM, and Ollama (Local/Cloud).
 */

export interface ModelDefinition {
  id: string;
  name: string;
  provider: "openrouter" | "google" | "groq" | "nvidia" | "ollama";
  category: "chat" | "reasoning" | "coding" | "fast" | "moe";
  context_length: number;
  is_free: boolean;
  is_offline: boolean;
  parameters?: string;
  recommended_ram_gb?: number;
}

export const CATALOG_MODELS: ModelDefinition[] = [
  // OpenRouter (Free Cloud)
  {
    id: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1 (Free)",
    provider: "openrouter",
    category: "reasoning",
    context_length: 64000,
    is_free: true,
    is_offline: false,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B (Free)",
    provider: "openrouter",
    category: "coding",
    context_length: 128000,
    is_free: true,
    is_offline: false,
  },
  {
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    name: "Qwen 2.5 Coder 32B (Free)",
    provider: "openrouter",
    category: "coding",
    context_length: 32768,
    is_free: true,
    is_offline: false,
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash Exp (Free)",
    provider: "openrouter",
    category: "fast",
    context_length: 1048576,
    is_free: true,
    is_offline: false,
  },
  {
    id: "meta-llama/llama-3.1-8b-instruct:free",
    name: "Llama 3.1 8B Instruct (Free)",
    provider: "openrouter",
    category: "chat",
    context_length: 131072,
    is_free: true,
    is_offline: false,
  },

  // Google AI Studio
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    category: "coding",
    context_length: 1048576,
    is_free: true,
    is_offline: false,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    category: "reasoning",
    context_length: 2097152,
    is_free: true,
    is_offline: false,
  },

  // Groq (Ultra-Fast Free Tier)
  {
    id: "llama-3.3-70b-versatile",
    name: "Groq Llama 3.3 70B Versatile",
    provider: "groq",
    category: "coding",
    context_length: 128000,
    is_free: true,
    is_offline: false,
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "Groq DeepSeek R1 Distill 70B",
    provider: "groq",
    category: "reasoning",
    context_length: 128000,
    is_free: true,
    is_offline: false,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Groq Llama 3.1 8B Instant",
    provider: "groq",
    category: "fast",
    context_length: 128000,
    is_free: true,
    is_offline: false,
  },
  {
    id: "qwen-qwq-32b",
    name: "Groq QwQ 32B (Reasoning)",
    provider: "groq",
    category: "reasoning",
    context_length: 32768,
    is_free: true,
    is_offline: false,
  },

  // NVIDIA NIM (Free Developer Tier)
  {
    id: "meta/llama-3.3-70b-instruct",
    name: "NVIDIA Llama 3.3 70B",
    provider: "nvidia",
    category: "coding",
    context_length: 128000,
    is_free: true,
    is_offline: false,
  },
  {
    id: "deepseek-ai/deepseek-r1",
    name: "NVIDIA DeepSeek R1",
    provider: "nvidia",
    category: "reasoning",
    context_length: 64000,
    is_free: true,
    is_offline: false,
  },

  // Ollama Local Offline Models (Quantized GGUF)
  {
    id: "qwen2.5-coder:0.5b",
    name: "Qwen 2.5 Coder 0.5B (Tiny Local)",
    provider: "ollama",
    category: "fast",
    context_length: 32768,
    is_free: true,
    is_offline: true,
    parameters: "0.5B",
    recommended_ram_gb: 0.8,
  },
  {
    id: "qwen2.5-coder:1.5b",
    name: "Qwen 2.5 Coder 1.5B (Fast Snippets)",
    provider: "ollama",
    category: "coding",
    context_length: 32768,
    is_free: true,
    is_offline: true,
    parameters: "1.5B",
    recommended_ram_gb: 1.5,
  },
  {
    id: "deepseek-r1:1.5b",
    name: "DeepSeek R1 1.5B (Local Reasoning)",
    provider: "ollama",
    category: "reasoning",
    context_length: 32768,
    is_free: true,
    is_offline: true,
    parameters: "1.5B",
    recommended_ram_gb: 1.5,
  },
  {
    id: "llama3.2:3b",
    name: "Llama 3.2 3B (Local Offline)",
    provider: "ollama",
    category: "chat",
    context_length: 128000,
    is_free: true,
    is_offline: true,
    parameters: "3.2B",
    recommended_ram_gb: 3.0,
  },
];

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ProviderKeys {
  openrouter?: string;
  google?: string;
  groq?: string;
  nvidia?: string;
  ollama_host?: string;
}

export async function callAIModel(
  modelId: string,
  messages: ChatMessage[],
  keys: ProviderKeys = {},
  tools?: any[]
): Promise<{ text: string; tool_calls?: any[]; usage?: any; modelUsed?: string }> {
  let targetModel = CATALOG_MODELS.find((m) => m.id === modelId) || {
    id: modelId,
    name: modelId,
    provider: (modelId.startsWith("deepseek/") || modelId.startsWith("meta-llama/") || modelId.startsWith("qwen/") || modelId.includes(":free"))
      ? "openrouter"
      : (modelId.includes("gemini") ? "google" : (modelId.includes("llama") || modelId.includes("qwq") ? "groq" : "openrouter")),
    category: "chat" as const,
  };

  const openrouterKey = keys.openrouter || process.env.OPENROUTER_API_KEY;
  const groqKey = keys.groq || process.env.GROQ_API_KEY;
  const googleKey = keys.google || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const nvidiaKey = keys.nvidia || process.env.NVIDIA_API_KEY;
  const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

  // Check if requested provider is configured
  const isTargetReady = (provider: string) => {
    if (provider === "openrouter") return Boolean(openrouterKey);
    if (provider === "groq") return Boolean(groqKey);
    if (provider === "google") return Boolean(googleKey);
    if (provider === "nvidia") return Boolean(nvidiaKey);
    if (provider === "ollama") return !isVercel;
    return false;
  };

  // If the target provider is not ready, dynamically route to a configured provider!
  if (!isTargetReady(targetModel.provider)) {
    const activeProvider = openrouterKey
      ? "openrouter"
      : groqKey
      ? "groq"
      : googleKey
      ? "google"
      : nvidiaKey
      ? "nvidia"
      : (!isVercel ? "ollama" : null);

    if (activeProvider) {
      const cat = targetModel.category || "chat";
      if (activeProvider === "openrouter") {
        if (cat === "reasoning") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "deepseek/deepseek-r1:free") || targetModel;
        } else if (cat === "coding") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "qwen/qwen-2.5-coder-32b-instruct:free") || targetModel;
        } else if (cat === "fast") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "google/gemini-2.0-flash-exp:free") || targetModel;
        } else {
          targetModel = CATALOG_MODELS.find((m) => m.id === "meta-llama/llama-3.3-70b-instruct:free") ||
            CATALOG_MODELS.find((m) => m.id === "meta-llama/llama-3.1-8b-instruct:free") ||
            CATALOG_MODELS.find((m) => m.id === "deepseek/deepseek-r1:free") || targetModel;
        }
      } else if (activeProvider === "groq") {
        if (cat === "reasoning") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "deepseek-r1-distill-llama-70b") || targetModel;
        } else if (cat === "coding") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "llama-3.3-70b-versatile") || targetModel;
        } else {
          targetModel = CATALOG_MODELS.find((m) => m.id === "llama-3.1-8b-instant") || targetModel;
        }
      } else if (activeProvider === "google") {
        if (cat === "reasoning") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "gemini-2.5-pro") || targetModel;
        } else {
          targetModel = CATALOG_MODELS.find((m) => m.id === "gemini-2.5-flash") || targetModel;
        }
      } else if (activeProvider === "nvidia") {
        if (cat === "reasoning") {
          targetModel = CATALOG_MODELS.find((m) => m.id === "deepseek-ai/deepseek-r1") || targetModel;
        } else {
          targetModel = CATALOG_MODELS.find((m) => m.id === "meta/llama-3.3-70b-instruct") || targetModel;
        }
      }
    }
  }

  // 1. OpenRouter
  if (targetModel.provider === "openrouter") {
    const key = openrouterKey;
    if (!key) throw new Error("OpenRouter API key is required. Add it in the AI Settings drawer.");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github-guardian.vercel.app",
        "X-Title": "GitHub Guardian",
      },
      body: JSON.stringify({
        model: targetModel.id,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`OpenRouter Error: ${data?.error?.message || JSON.stringify(data)}`);
    const choice = data.choices?.[0]?.message;
    return {
      text: choice?.content || "",
      tool_calls: choice?.tool_calls,
      usage: data.usage,
      modelUsed: targetModel.id,
    };
  }

  // 2. Groq
  if (targetModel.provider === "groq") {
    const key = groqKey;
    if (!key) throw new Error("Groq API key is required. Add it in the AI Settings drawer.");

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: targetModel.id,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Groq Error: ${data?.error?.message || JSON.stringify(data)}`);
    const choice = data.choices?.[0]?.message;
    return {
      text: choice?.content || "",
      tool_calls: choice?.tool_calls,
      usage: data.usage,
      modelUsed: targetModel.id,
    };
  }

  // 3. Google AI Studio (Gemini REST)
  if (targetModel.provider === "google") {
    const key = googleKey;
    if (!key) throw new Error("Google AI Studio API key is required. Add it in the AI Settings drawer.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel.id}:generateContent?key=${key}`;
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find((m) => m.role === "system")?.content;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Google Gemini Error: ${data?.error?.message || JSON.stringify(data)}`);
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";
    return { text, modelUsed: targetModel.id };
  }

  // 4. NVIDIA NIM
  if (targetModel.provider === "nvidia") {
    const key = nvidiaKey;
    if (!key) throw new Error("NVIDIA NIM API key is required. Add it in the AI Settings drawer.");

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: targetModel.id,
        messages,
        tools: tools && tools.length > 0 ? tools : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`NVIDIA NIM Error: ${data?.error?.message || JSON.stringify(data)}`);
    const choice = data.choices?.[0]?.message;
    return {
      text: choice?.content || "",
      tool_calls: choice?.tool_calls,
      modelUsed: targetModel.id,
    };
  }

  // 5. Ollama (Local Offline / Cloud)
  if (targetModel.provider === "ollama") {
    const host = keys.ollama_host || process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${host}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel.id,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) throw new Error(`Ollama Error: ${data?.error || JSON.stringify(data)}`);
      return {
        text: data.message?.content || "",
        modelUsed: targetModel.id,
      };
    } catch (ollamaErr: any) {
      // If Ollama is offline or we are on Vercel, fallback to cloud if any key is available
      if (openrouterKey || groqKey || googleKey || nvidiaKey) {
        const fallbackId = openrouterKey
          ? (targetModel.category === "coding" ? "qwen/qwen-2.5-coder-32b-instruct:free" : "meta-llama/llama-3.3-70b-instruct:free")
          : groqKey
          ? "llama-3.1-8b-instant"
          : googleKey
          ? "gemini-2.5-flash"
          : "meta/llama-3.3-70b-instruct";
        return await callAIModel(fallbackId, messages, keys, tools);
      }
      throw new Error(`Local Ollama service at ${host} is unreachable. If running on Vercel, please add an OpenRouter, Groq, or Google AI key in the AI Settings drawer.`);
    }
  }

  throw new Error("No active AI provider key detected. Please add an OpenRouter, Groq, or Google AI key in the AI Settings drawer.");
}
