import { NextRequest, NextResponse } from "next/server";

const CURATED_HF_EDGE_MODELS = [
  {
    id: "bartowski/Llama-3.2-1B-Instruct-GGUF",
    name: "Llama 3.2 1B Instruct GGUF",
    author: "bartowski",
    pipeline_tag: "text-generation",
    downloads: 142800,
    likes: 310,
    size: "780 MB",
    quant: "Q4_K_M",
    description: "Meta's flagship edge conversational model optimized for ARM64 & mobile.",
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF",
    directGgufUrl: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
  },
  {
    id: "Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
    name: "Qwen 2.5 Coder 1.5B GGUF",
    author: "Qwen",
    pipeline_tag: "text-generation",
    downloads: 295400,
    likes: 540,
    size: "986 MB",
    quant: "Q4_K_M",
    description: "Supreme code snippet generation, AST syntax repair, and pull request patching.",
    url: "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF",
    directGgufUrl: "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf",
  },
  {
    id: "unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF",
    name: "DeepSeek R1 Distill 1.5B GGUF",
    author: "unsloth",
    pipeline_tag: "text-generation",
    downloads: 189200,
    likes: 420,
    size: "1.1 GB",
    quant: "Q4_K_M",
    description: "Chain-of-thought deep reasoning for multi-repo logic and conflict analysis.",
    url: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF",
    directGgufUrl: "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf",
  },
  {
    id: "vikhyatk/moondream2",
    name: "Moondream 2 Vision AI",
    author: "vikhyatk",
    pipeline_tag: "image-text-to-text",
    downloads: 382100,
    likes: 1250,
    size: "830 MB",
    quant: "FP16 / Int4",
    description: "Top edge visual AI: OCR text extraction, UI inspection, and screenshot auditing.",
    url: "https://huggingface.co/vikhyatk/moondream2",
    directGgufUrl: "https://huggingface.co/vikhyatk/moondream2/resolve/main/moondream2-text-model.bin",
  },
  {
    id: "HuggingFaceTB/SmolLM2-360M-Instruct-GGUF",
    name: "SmolLM2 360M Instruct GGUF",
    author: "HuggingFaceTB",
    pipeline_tag: "text-generation",
    downloads: 87400,
    likes: 215,
    size: "260 MB",
    quant: "Q4_K_M",
    description: "Ultra-fast responses with minimal footprint for conversational fleet control.",
    url: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF",
    directGgufUrl: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q4_k_m.gguf",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user");
    const token = searchParams.get("token") || process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;

    let userModels: any[] = [];

    if (user || token) {
      try {
        const headers: Record<string, string> = { "User-Agent": "GitHub-Guardian/1.0" };
        if (token) headers["Authorization"] = `Bearer ${token.trim()}`;

        const url = user
          ? `https://huggingface.co/api/models?author=${encodeURIComponent(user)}&limit=20`
          : `https://huggingface.co/api/models?limit=10`;

        const res = await fetch(url, { headers, cache: "no-store" });
        if (res.status === 200) {
          const data = await res.json();
          if (Array.isArray(data)) {
            userModels = data.map((m: any) => ({
              id: m.id,
              name: m.id.split("/")[1] || m.id,
              author: m.author || m.id.split("/")[0],
              pipeline_tag: m.pipeline_tag || "model",
              downloads: m.downloads || 0,
              likes: m.likes || 0,
              private: !!m.private,
              url: `https://huggingface.co/${m.id}`,
            }));
          }
        }
      } catch {
        // Fallback to curated models if network unavailable
      }
    }

    return NextResponse.json({
      success: true,
      user_models: userModels,
      curated_edge_models: CURATED_HF_EDGE_MODELS,
      total_curated: CURATED_HF_EDGE_MODELS.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
