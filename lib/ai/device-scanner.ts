/**
 * Device Hardware Scanner & Intelligent Offline Model Advisor.
 * Evaluates CPU cores, RAM, and storage to recommend the optimal local quantized model (0.5B to 4B GGUF).
 */

import os from "os";
import fs from "fs";

export interface DeviceSpecs {
  cpu_cores: number;
  cpu_model: string;
  total_ram_gb: number;
  available_ram_gb: number;
  architecture: string;
  recommended_local_model: string;
  recommended_model_size: string;
  recommended_reasoning: string;
  eligible_models: {
    name: string;
    tag: string;
    ram_needed_gb: number;
    description: string;
    recommended: boolean;
  }[];
}

export function scanDeviceHardware(): DeviceSpecs {
  const cpuCores = os.cpus()?.length || 4;
  const cpuModel = os.cpus()?.[0]?.model || "ARM64 Processor";
  const arch = os.arch();

  let totalRamMb = Math.round(os.totalmem() / (1024 * 1024));
  let freeRamMb = Math.round(os.freemem() / (1024 * 1024));

  // On Linux / Android, read /proc/meminfo for accurate MemAvailable
  try {
    if (fs.existsSync("/proc/meminfo")) {
      const meminfo = fs.readFileSync("/proc/meminfo", "utf-8");
      for (const line of meminfo.split("\n")) {
        if (line.startsWith("MemTotal:")) {
          totalRamMb = Math.round(parseInt(line.split(/\s+/)[1], 10) / 1024);
        } else if (line.startsWith("MemAvailable:")) {
          freeRamMb = Math.round(parseInt(line.split(/\s+/)[1], 10) / 1024);
        }
      }
    }
  } catch {
    // fallback to os.freemem()
  }

  const totalRamGb = parseFloat((totalRamMb / 1024).toFixed(1));
  const availableRamGb = parseFloat((freeRamMb / 1024).toFixed(1));

  // Determine optimal model tier
  let recommendedModel = "qwen2.5-coder:1.5b";
  let recommendedSize = "1.5B (Quantized Q4_K_M)";
  let recommendationReason = "Ideal balance of coding capability and fast inference within available RAM.";

  if (availableRamGb < 1.2) {
    recommendedModel = "qwen2.5-coder:0.5b";
    recommendedSize = "0.5B (Ultra-Tiny Q4_K_M)";
    recommendationReason = "Low available memory. 0.5B model requires only ~380 MB RAM and provides rapid syntax fixes.";
  } else if (availableRamGb >= 3.2) {
    recommendedModel = "llama3.2:3b";
    recommendedSize = "3.2B (Q4_K_M)";
    recommendationReason = "Ample memory detected. 3.2B model handles complex chat, reasoning, and multi-file patches.";
  }

  const eligibleModels = [
    {
      name: "Qwen 2.5 Coder 0.5B",
      tag: "qwen2.5-coder:0.5b",
      ram_needed_gb: 0.5,
      description: "Ultra-tiny model for syntax fixes, formatting, and quick patch linting.",
      recommended: availableRamGb < 1.2,
    },
    {
      name: "Qwen 2.5 Coder 1.5B",
      tag: "qwen2.5-coder:1.5b",
      ram_needed_gb: 1.2,
      description: "Fast code snippet generator, conflict resolver, and AST error repair.",
      recommended: availableRamGb >= 1.2 && availableRamGb < 3.2,
    },
    {
      name: "DeepSeek R1 1.5B (Distill)",
      tag: "deepseek-r1:1.5b",
      ram_needed_gb: 1.3,
      description: "Offline chain-of-thought reasoning for diagnosing tricky bug logic.",
      recommended: false,
    },
    {
      name: "Llama 3.2 3B",
      tag: "llama3.2:3b",
      ram_needed_gb: 2.4,
      description: "Full offline multi-turn conversation and deep repository context analysis.",
      recommended: availableRamGb >= 3.2,
    },
  ];

  return {
    cpu_cores: cpuCores,
    cpu_model: cpuModel,
    total_ram_gb: totalRamGb,
    available_ram_gb: availableRamGb,
    architecture: arch,
    recommended_local_model: recommendedModel,
    recommended_model_size: recommendedSize,
    recommended_reasoning: recommendationReason,
    eligible_models: eligibleModels,
  };
}
