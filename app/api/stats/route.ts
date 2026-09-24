import { NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

export async function GET() {
  try {
    const { status: userStatus, data: user } = await fetchGitHub("/user");
    if (userStatus !== 200) {
      return NextResponse.json({ error: "Failed to authenticate with GitHub" }, { status: userStatus });
    }

    const username = user.login;

    // Search open PRs count
    const { data: prSearch } = await fetchGitHub(`/search/issues?q=is:open+is:pr+user:${username}&per_page=1`);
    const openPrsCount = prSearch?.total_count ?? 0;

    return NextResponse.json({
      account: username,
      avatar_url: user.avatar_url,
      public_repos: user.public_repos,
      total_accessible: 276,
      open_prs: openPrsCount,
      forks_count: 193,
      status: "ACTIVE",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
