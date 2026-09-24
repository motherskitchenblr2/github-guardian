/**
 * Intelligent AI Router & Aggregator for GitHub Guardian.
 * Automatically routes tasks to the optimal LLM based on task complexity,
 * model specialization, and user preferences (Chat, Reasoning, Coding, MoE).
 */

import { CATALOG_MODELS, ModelDefinition } from "./providers";

export type AutonomyMode = "yolo" | "ask_important" | "always_ask";

export interface ModelAssignments {
  chat_model: string;
  reasoning_model: string;
  coding_model: string;
  fast_model: string;
  autonomy_mode: AutonomyMode;
}

export const DEFAULT_MODEL_ASSIGNMENTS: ModelAssignments = {
  chat_model: "llama-3.1-8b-instant",
  reasoning_model: "deepseek/deepseek-r1:free",
  coding_model: "qwen/qwen-2.5-coder-32b-instruct:free",
  fast_model: "llama-3.1-8b-instant",
  autonomy_mode: "ask_important",
};

export class AIRouter {
  private assignments: ModelAssignments;

  constructor(customAssignments?: Partial<ModelAssignments>) {
    this.assignments = { ...DEFAULT_MODEL_ASSIGNMENTS, ...customAssignments };
  }

  public getAssignments(): ModelAssignments {
    return this.assignments;
  }

  public updateAssignments(newAssignments: Partial<ModelAssignments>) {
    this.assignments = { ...this.assignments, ...newAssignments };
  }

  /**
   * Intelligently selects the best model for a given user request or automated task.
   */
  public routeTask(
    userPrompt: string,
    forcedModelId?: string,
    context?: { hasConflicts?: boolean; isSecurityAudit?: boolean; isQuickPatch?: boolean }
  ): { selectedModelId: string; reason: string; category: string } {
    // 1. Explicit override by user dropdown
    if (forcedModelId && forcedModelId !== "auto") {
      const found = CATALOG_MODELS.find((m) => m.id === forcedModelId);
      return {
        selectedModelId: forcedModelId,
        reason: `Manually selected by user: ${found?.name || forcedModelId}`,
        category: found?.category || "custom",
      };
    }

    const lower = userPrompt.toLowerCase();

    // 2. Deep Reasoning & Complex Conflict Resolution
    if (
      context?.hasConflicts ||
      context?.isSecurityAudit ||
      lower.includes("conflict") ||
      lower.includes("security") ||
      lower.includes("vulnerability") ||
      lower.includes("audit") ||
      lower.includes("why") ||
      lower.includes("analyze") ||
      lower.includes("diagnose") ||
      lower.includes("deepseek") ||
      lower.includes("reasoning")
    ) {
      return {
        selectedModelId: this.assignments.reasoning_model,
        reason: "Routed to Reasoning Model for multi-step diagnosis and conflict resolution.",
        category: "reasoning",
      };
    }

    // 3. Coding & Syntax / Dependency Patches
    if (
      context?.isQuickPatch ||
      lower.includes("fix") ||
      lower.includes("patch") ||
      lower.includes("syntax") ||
      lower.includes("code") ||
      lower.includes("bump") ||
      lower.includes("dependency") ||
      lower.includes("merge") ||
      lower.includes("rebase") ||
      lower.includes("refactor")
    ) {
      return {
        selectedModelId: this.assignments.coding_model,
        reason: "Routed to Coding Model for precise AST code generation and syntax fixes.",
        category: "coding",
      };
    }

    // 4. Default Chat & Orchestration
    return {
      selectedModelId: this.assignments.chat_model,
      reason: "Routed to Chat Model for fast conversational response.",
      category: "chat",
    };
  }

  /**
   * Checks whether the current autonomy mode requires asking the user for confirmation.
   */
  public shouldAskConfirmation(actionType: "read" | "safe_write" | "important_write"): boolean {
    if (this.assignments.autonomy_mode === "yolo") {
      return false; // YOLO executes everything autonomously
    }

    if (this.assignments.autonomy_mode === "always_ask") {
      return actionType !== "read"; // Always asks for any write
    }

    // "ask_important": auto-executes safe_write (dependency merges, fast-forward forks)
    // but asks for important_write (conflict fixes, code rewrites, branch deletion)
    return actionType === "important_write";
  }
}
