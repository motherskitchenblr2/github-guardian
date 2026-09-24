/**
 * Server-side GitHub API client for Next.js API Routes and Server Actions.
 * Reads token securely from process.env.GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN.
 */

const GITHUB_BASE = "https://api.github.com";

export function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN environment variable on server.");
  }
  return token.trim();
}

export async function fetchGitHub<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const token = getGitHubToken();
  const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GitHub-Guardian-Web/1.0",
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const status = res.status;
  let data: any = null;

  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return { status, data };
}

export async function getAuthenticatedUser() {
  const { status, data } = await fetchGitHub("/user");
  if (status !== 200) {
    throw new Error(`Failed to fetch GitHub user: ${JSON.stringify(data)}`);
  }
  return data;
}
