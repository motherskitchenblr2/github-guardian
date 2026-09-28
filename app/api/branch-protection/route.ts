import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";
import {
  BranchProtectionRules,
  RECOMMENDED_GUARDIAN_RULES,
  STRICT_ENTERPRISE_RULES,
} from "@/lib/security/branch-protection";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";

    if (!repo) {
      return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
    }

    const { status, data } = await fetchGitHub(`/repos/${repo}/branches/${encodeURIComponent(branch)}/protection`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (status === 200 && data) {
      const activeRules: BranchProtectionRules = {
        enforceAdmins: !!data.enforce_admins?.enabled,
        requirePullRequests: !!data.required_pull_request_reviews,
        reviewCount: data.required_pull_request_reviews?.required_approving_review_count || 1,
        dismissStale: !!data.required_pull_request_reviews?.dismiss_stale_reviews,
        requireCodeOwner: !!data.required_pull_request_reviews?.require_code_owner_reviews,
        requireLastPushApproval: !!data.required_pull_request_reviews?.require_last_push_approval,
        requireStatusChecks: !!data.required_status_checks,
        strictChecks: !!data.required_status_checks?.strict,
        requiredLinearHistory: !!data.required_linear_history?.enabled,
        allowForcePushes: !!data.allow_force_pushes?.enabled,
        allowDeletions: !!data.allow_deletions?.enabled,
        requiredConversationResolution: !!data.required_conversation_resolution?.enabled,
      };

      return NextResponse.json({
        repo,
        branch,
        is_protected: true,
        rules: activeRules,
        raw: data,
      });
    } else if (status === 404) {
      return NextResponse.json({
        repo,
        branch,
        is_protected: false,
        rules: null,
        message: "No branch protection rules configured for this branch.",
      });
    } else {
      return NextResponse.json({
        repo,
        branch,
        is_protected: false,
        error: data?.message || "Failed to inspect branch protection",
      }, { status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repo, branch = "main", rules, action = "apply", preset } = body;

    if (!repo) {
      return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
    }

    // 1. AI Recommendation Action
    if (action === "ai_recommend") {
      const targetRules = preset === "strict" ? STRICT_ENTERPRISE_RULES : RECOMMENDED_GUARDIAN_RULES;
      const rationale = [
        "1. Block Force Pushes: Guarantees Git commit history is immutable and cannot be rewritten or erased by automated scripts.",
        "2. Block Deletions: Prevents accidental or rogue deletion of the primary mainline branch.",
        "3. Enforce for Administrators: Guarantees zero bypasses, enforcing SOC-2 and ISO-27001 continuous compliance.",
        "4. Require Pull Request Reviews: Ensures all changes undergo peer verification and automated scanning before merging.",
        "5. Dismiss Stale Reviews: Invalidates previous approvals if new code or dependencies are pushed.",
        "6. Required Linear History: Maintains a clean, bisectable commit log ideal for squash-merging.",
      ];

      return NextResponse.json({
        success: true,
        repo,
        branch,
        recommended_preset: preset || "guardian_recommended",
        recommended_rules: targetRules,
        rationale,
        ai_verdict: "GUARDIAN SHIELD POLICY ENFORCED: Maximum defense with zero risk of branch erasure.",
      });
    }

    // 2. Apply Branch Protection Rule to GitHub
    const selectedRules: BranchProtectionRules = rules || (preset === "strict" ? STRICT_ENTERPRISE_RULES : RECOMMENDED_GUARDIAN_RULES);

    const payload: Record<string, any> = {
      enforce_admins: selectedRules.enforceAdmins,
      required_status_checks: selectedRules.requireStatusChecks
        ? { strict: selectedRules.strictChecks, contexts: [] }
        : null,
      required_pull_request_reviews: selectedRules.requirePullRequests
        ? {
            dismiss_stale_reviews: selectedRules.dismissStale,
            require_code_owner_reviews: selectedRules.requireCodeOwner,
            required_approving_review_count: selectedRules.reviewCount || 1,
            require_last_push_approval: selectedRules.requireLastPushApproval,
          }
        : null,
      restrictions: null,
      required_linear_history: selectedRules.requiredLinearHistory,
      allow_force_pushes: selectedRules.allowForcePushes,
      allow_deletions: selectedRules.allowDeletions,
      required_conversation_resolution: selectedRules.requiredConversationResolution,
    };

    const { status, data } = await fetchGitHub(`/repos/${repo}/branches/${encodeURIComponent(branch)}/protection`, {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (status === 200) {
      return NextResponse.json({
        success: true,
        repo,
        branch,
        message: `✅ Branch protection rules successfully applied to ${repo} on branch '${branch}'!`,
        rules: selectedRules,
      });
    } else {
      return NextResponse.json({
        success: false,
        status,
        error: data?.message || "Failed to update branch protection on GitHub",
      }, { status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";

    if (!repo) {
      return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
    }

    const { status, data } = await fetchGitHub(`/repos/${repo}/branches/${encodeURIComponent(branch)}/protection`, {
      method: "DELETE",
      headers: { Accept: "application/vnd.github.v3+json" },
    });

    if (status === 204 || status === 200) {
      return NextResponse.json({
        success: true,
        repo,
        branch,
        message: `Branch protection rules removed for ${repo} on branch '${branch}'.`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data?.message || "Failed to remove branch protection",
      }, { status });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
