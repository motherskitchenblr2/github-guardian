import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const visibility = searchParams.get("visibility") || "all"; // 'all' | 'public' | 'private'
    const search = (searchParams.get("search") || "").toLowerCase();

    // Fetch all owned repos
    const allRepos: any[] = [];
    let page = 1;

    while (page <= 4) {
      const { status, data } = await fetchGitHub(
        `/user/repos?affiliation=owner&per_page=100&page=${page}&sort=updated`
      );
      if (status !== 200 || !Array.isArray(data) || data.length === 0) break;
      allRepos.push(...data);
      if (data.length < 100) break;
      page++;
    }

    const publicCount = allRepos.filter((r) => !r.private).length;
    const privateCount = allRepos.filter((r) => r.private).length;

    let filtered = allRepos;
    if (visibility === "public") {
      filtered = filtered.filter((r) => !r.private);
    } else if (visibility === "private") {
      filtered = filtered.filter((r) => r.private);
    }

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          (r.description && r.description.toLowerCase().includes(search)) ||
          (r.language && r.language.toLowerCase().includes(search))
      );
    }

    const mapped = filtered.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      visibility: r.private ? "private" : "public",
      fork: r.fork,
      description: r.description || "No description provided",
      html_url: r.html_url,
      language: r.language || "Plain Text",
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      open_issues: r.open_issues_count || 0,
      updated_at: r.updated_at,
    }));

    return NextResponse.json({
      total_count: allRepos.length,
      public_count: publicCount,
      private_count: privateCount,
      repos: mapped,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
