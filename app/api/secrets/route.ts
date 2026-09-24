import { NextRequest, NextResponse } from "next/server";
import { fetchGitHub } from "@/lib/github";

const SECRET_REGEXES: Record<string, RegExp> = {
  "GitHub Personal Access Token": /github_pat_[A-Za-z0-9_]{82}/g,
  "GitHub Classic Token": /gh[pousr]_[A-Za-z0-9_]{36}/g,
  "OpenAI API Key": /sk-(?:proj-)?[A-Za-z0-9_-]{20,64}/g,
  "Anthropic API Key": /sk-ant-api03-[A-Za-z0-9_-]{32,64}/g,
  "Google Gemini API Key": /AIzaSy[A-Za-z0-9_-]{33}/g,
  "AWS Access Key": /\bAKIA[0-9A-Z]{16}\b/g,
  "Private RSA Key": /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
};

function maskSecret(val: string) {
  if (val.length <= 8) return "****";
  return `${val.slice(0, 4)}...${val.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  try {
    const { status, data: repos } = await fetchGitHub("/user/repos?type=owner&sort=pushed&per_page=10");
    if (status !== 200 || !Array.isArray(repos)) {
      return NextResponse.json({ findings: [], scanned_count: 0 });
    }

    const findings: any[] = [];

    for (const repo of repos) {
      const { data: commits } = await fetchGitHub(`/repos/${repo.full_name}/commits?per_page=3`);
      if (Array.isArray(commits)) {
        for (const c of commits) {
          const msg = c.commit?.message || "";
          for (const [name, regex] of Object.entries(SECRET_REGEXES)) {
            const matches = msg.match(regex);
            if (matches) {
              matches.forEach((m) => {
                findings.push({
                  repo: repo.full_name,
                  commit: c.sha.slice(0, 7),
                  type: name,
                  masked: maskSecret(m),
                  location: "commit message",
                });
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      scanned_count: repos.length,
      findings,
      status: findings.length === 0 ? "ALL CLEAN" : "FINDINGS DETECTED",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
