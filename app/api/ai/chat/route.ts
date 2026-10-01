import { NextRequest, NextResponse } from "next/server";
import { callAIModel, ChatMessage, ProviderKeys } from "@/lib/ai/providers";
import { AIRouter, AutonomyMode } from "@/lib/ai/router";
import { AGENT_TOOLS, executeAgentTool } from "@/lib/ai/tools";
import { GITHUB_FRAMEWORK_SKILLS } from "@/lib/ai/github-framework";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, modelId, autonomyMode = "ask_important", customKeys = {} } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 });
    }

    const router = new AIRouter({ autonomy_mode: autonomyMode as AutonomyMode }, customKeys);
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Intelligently route task to the best model if modelId is "auto"
    const routing = router.routeTask(lastUserMessage, modelId);
    const activeModelId = routing.selectedModelId;

    // 2. Prepare System Prompt for the Autonomous Agent with Complete GitHub Framework
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `You are the Principal Autonomous AI Agent of GitHub Guardian, equipped with full mastery of the GitHub Ecosystem and DevSecOps architecture across 242 repositories, 193 forks, pull requests, branch protections, and local edge models.

${GITHUB_FRAMEWORK_SKILLS}

EXECUTION AUTONOMY LEVEL: "${autonomyMode.toUpperCase()}"
${
  autonomyMode === "yolo"
    ? "YOLO MODE: You have authorization to execute branch protection policies, squash merges, syncs, rebases, and fixes autonomously without asking."
    : autonomyMode === "always_ask"
    ? "ALWAYS ASK: Present your detailed recommendations with rationale and wait for user confirmation before executing any modifying tool."
    : "ASK ON IMPORTANT: Auto-execute safe reads and fast-forwards; ask confirmation before modifying branch protections or applying irreversible changes."
}
AVAILABLE AGENT TOOLS: get_fleet_status, list_open_prs, merge_pull_request, rebase_pull_request, sync_fork, scan_secrets, harden_repository, get_branch_protection, apply_branch_protection, get_device_hardware.

Always respond with rigorous adherence to official GitHub standards, correct API endpoints, clear markdown formatting, and least-privilege security.`,
    };

    const fullMessages = [systemPrompt, ...messages];

    // 3. Call AI with Agent Tools enabled
    let response = await callAIModel(activeModelId, fullMessages, customKeys, AGENT_TOOLS);

    // 4. Handle Tool Calls
    const toolExecutions: any[] = [];
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const call of response.tool_calls) {
        const toolName = call.function.name;
        let args = {};
        try {
          args = typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments;
        } catch {
          args = {};
        }

        try {
          const toolResult = await executeAgentTool(toolName, args);
          toolExecutions.push({ tool: toolName, args, result: toolResult });
        } catch (err: any) {
          toolExecutions.push({ tool: toolName, args, error: err.message });
        }
      }

      // Generate final response summarizing executed tools
      const followUpMessages: ChatMessage[] = [
        ...fullMessages,
        {
          role: "assistant",
          content: response.text || "",
          tool_calls: response.tool_calls,
        },
        ...toolExecutions.map((t) => ({
          role: "tool" as const,
          name: t.tool,
          content: JSON.stringify(t.result || t.error),
        })),
      ];

      const finalResponse = await callAIModel(activeModelId, followUpMessages, customKeys);
      return NextResponse.json({
        modelUsed: activeModelId,
        routingReason: routing.reason,
        response: finalResponse.text,
        toolsExecuted: toolExecutions,
      });
    }

    return NextResponse.json({
      modelUsed: activeModelId,
      routingReason: routing.reason,
      response: response.text,
      toolsExecuted: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
