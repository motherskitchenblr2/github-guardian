import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "40", 10);

    const { status, data } = await fetchGitHub(`/user/repos?type=owner&per_page=${limit}&page=${page}&sort=updated`);
    if (status !== 200 || !Array.isArray(data)) {
      return NextResponse.json({ forks: [] });
    }

    const forks = data
      .filter((r: any) => r.fork)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        default_branch: r.default_branch,
        html_url: r.html_url,
        updated_at: r.updated_at,
        pushed_at: r.pushed_at,
      }));

    return NextResponse.json({ forks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repo, branch } = body;

    if (!repo) {
      return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 });
    }

    const { status, data } = await fetchGitHub(`/repos/${repo}/merge-upstream`, {
      method: "POST",
      body: JSON.stringify({ branch: branch || "main" }),
    });

    return NextResponse.json({ status, message: data?.message || "Sync request executed", result: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
