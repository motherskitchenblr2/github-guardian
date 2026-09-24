import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const filter = searchParams.get("filter") || "all";

    const { data: user } = await fetchGitHub("/user");
    const username = user?.login || "motherskitchenblr2";

    let query = `is:open+is:pr+user:${username}`;
    if (filter === "dependabot") {
      query += "+author:app/dependabot";
    }

    const { status, data } = await fetchGitHub(`/search/issues?q=${query}&per_page=${limit}`);
    if (status !== 200) {
      return NextResponse.json({ error: "Failed to search PRs", details: data }, { status });
    }

    const items = data?.items || [];
    const prs = items.map((item: any) => {
      const repoUrl = item.repository_url || "";
      const repoName = repoUrl.replace("https://api.github.com/repos/", "");
      return {
        id: item.id,
        number: item.number,
        title: item.title,
        repo: repoName,
        author: item.user?.login || "unknown",
        url: item.html_url,
        created_at: item.created_at,
        labels: item.labels?.map((l: any) => l.name) || [],
      };
    });

    return NextResponse.json({ total: data.total_count, prs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
