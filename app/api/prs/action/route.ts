import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, repo, prNumber, commitTitle } = body;

    if (!repo || !prNumber) {
      return NextResponse.json({ error: "Missing repo or prNumber" }, { status: 400 });
    }

    if (action === "merge") {
      const { status, data } = await fetchGitHub(`/repos/${repo}/pulls/${prNumber}/merge`, {
        method: "PUT",
        body: JSON.stringify({
          merge_method: "squash",
          commit_title: commitTitle || `Auto-merge PR #${prNumber}`,
          commit_message: "Merged via GitHub Guardian Mobile Dashboard",
        }),
      });

      if (status === 200) {
        return NextResponse.json({ success: true, message: "Pull Request successfully squash-merged!" });
      } else if (status === 405) {
        // Conflict on merge attempt -> trigger rebase
        await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`, {
          method: "POST",
          body: JSON.stringify({ body: "@dependabot rebase" }),
        });
        return NextResponse.json({
          success: false,
          conflict: true,
          message: "Conflict detected: Triggered @dependabot rebase automatically!",
        });
      } else {
        return NextResponse.json({ success: false, error: data?.message || "Merge failed", status });
      }
    } else if (action === "rebase") {
      const { status, data } = await fetchGitHub(`/repos/${repo}/issues/${prNumber}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: "@dependabot rebase" }),
      });
      return NextResponse.json({ success: status === 201, message: "Rebase request dispatched to Dependabot!" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
