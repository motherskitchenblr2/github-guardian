import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repo } = body;

    if (!repo) {
      return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
    }

    const { status: vaStatus } = await fetchGitHub(`/repos/${repo}/vulnerability-alerts`, {
      method: "PUT",
    });

    const { status: afStatus } = await fetchGitHub(`/repos/${repo}/automated-security-fixes`, {
      method: "PUT",
    });

    return NextResponse.json({
      repo,
      vulnerability_alerts: vaStatus === 204 || vaStatus === 200,
      automated_fixes: afStatus === 204 || afStatus === 200,
      status: "SECURED",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
