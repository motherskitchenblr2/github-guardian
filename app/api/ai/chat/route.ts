import { NextRequest, NextResponse } from "next/server";
import { callAIModel, ChatMessage, ProviderKeys } from "@/lib/ai/providers";
import { AIRouter, AutonomyMode } from "@/lib/ai/router";
import { AGENT_TOOLS, executeAgentTool } from "@/lib/ai/tools";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, modelId, autonomyMode = "ask_important", customKeys = {} } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 });
    }

    const router = new AIRouter({ autonomy_mode: autonomyMode as AutonomyMode });
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 1. Intelligently route task to the best model if modelId is "auto"
    const routing = router.routeTask(lastUserMessage, modelId);
    const activeModelId = routing.selectedModelId;

    // 2. Prepare System Prompt for the Autonomous Agent
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `You are the Autonomous AI Agent of GitHub Guardian, with complete operational control over the user's 242 repositories, 193 forks, pull requests, security alerts, and local offline models.
Your current execution mode is: "${autonomyMode.toUpperCase()}".
${
  autonomyMode === "yolo"
    ? "YOLO MODE ACTIVE: You have permission to execute merges, syncs, rebases, and fixes autonomously without asking."
    : autonomyMode === "always_ask"
    ? "ALWAYS ASK MODE: Provide your recommended plan and ask user confirmation before running any modifying tool."
    : "ASK ON IMPORTANT MODE: Auto-execute safe operations (dependency merges, fork fast-forwards), but ask confirmation before any breaking or destructive changes."
}
You have direct access to tools: get_fleet_status, list_open_prs, merge_pull_request, rebase_pull_request, sync_fork, scan_secrets, harden_repository, and get_device_hardware.
Always be concise, proactive, accurate, and output clean markdown.`,
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
