#!/usr/bin/env python3
"""
GitHub Guardian - Secret & Access Token Leakage Scanner.
Scans repositories, recent commits, and code files for exposed secrets,
including GitHub tokens, OpenAI keys, AWS credentials, and private keys.
Automatically redacts sensitive values in reports to avoid further exposure.
"""

import re
import time
from typing import Any, Dict, List, Optional
from github_client import GitHubClient


SECRET_PATTERNS = {
    "GitHub Personal Access Token": re.compile(r"github_pat_[A-Za-z0-9_]{82}"),
    "GitHub Classic Token": re.compile(r"gh[pousr]_[A-Za-z0-9_]{36}"),
    "OpenAI API Key": re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,64}"),
    "Anthropic API Key": re.compile(r"sk-ant-api03-[A-Za-z0-9_-]{32,64}"),
    "Google / Gemini API Key": re.compile(r"AIzaSy[A-Za-z0-9_-]{33}"),
    "AWS Access Key ID": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "RSA / SSH Private Key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    "Slack Token": re.compile(r"xox[baprs]-[0-9A-Za-z]{10,48}"),
    "Stripe Secret Key": re.compile(r"sk_live_[0-9a-zA-Z]{24}"),
    "Database URL with Credentials": re.compile(r"(?:postgres|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:[^@\s]+@[^\s\/]+"),
}


def mask_secret(secret: str) -> str:
    """Mask secret value so it is safe to display in reports."""
    if len(secret) <= 8:
        return "****"
    return f"{secret[:4]}...{secret[-4:]}"


class SecretScanner:
    def __init__(self, client: GitHubClient):
        self.client = client
        self.username = client.get_user_login()

    def scan_text(self, text: str, source_context: str = "") -> List[Dict[str, str]]:
        """Scan a block of text for secret patterns."""
        findings = []
        for name, pattern in SECRET_PATTERNS.items():
            matches = pattern.finditer(text)
            for m in matches:
                secret_str = m.group(0)
                findings.append({
                    "type": name,
                    "masked": mask_secret(secret_str),
                    "context": source_context,
                    "position": f"{m.start()}-{m.end()}",
                })
        return findings

    def scan_recent_commits(self, repo_full_name: str, max_commits: int = 10) -> List[Dict[str, Any]]:
        """Scan recent commit diffs for accidental credential leakage."""
        findings = []
        status, commits = self.client.get(f"/repos/{repo_full_name}/commits?per_page={max_commits}")
        if status != 200 or not isinstance(commits, list):
            return findings

        for commit in commits:
            sha = commit.get("sha", "")
            msg = commit.get("commit", {}).get("message", "")

            # Check commit message itself
            msg_findings = self.scan_text(msg, f"{repo_full_name} commit {sha[:7]} message")
            findings.extend(msg_findings)

            # Check commit diff
            diff_status, commit_detail = self.client.get(f"/repos/{repo_full_name}/commits/{sha}")
            if diff_status == 200 and isinstance(commit_detail, dict):
                files = commit_detail.get("files", [])
                for f in files:
                    filename = f.get("filename", "")
                    # Flag committed sensitive files (ignoring templates / examples)
                    low_name = filename.lower()
                    is_template = any(t in low_name for t in (".example", ".template", ".sample", ".test", ".dist", ".sample"))
                    if not is_template and (low_name.endswith(".env") or "/.env" in low_name or any(sensitive in low_name for sensitive in ("id_rsa", "id_ed25519", "credentials.json", "service-account.json", "service_account.json"))):
                        findings.append({
                            "type": "Sensitive File Committed",
                            "masked": filename,
                            "context": f"{repo_full_name} commit {sha[:7]} ({filename})",
                            "position": "file_path",
                        })

                    patch = f.get("patch", "")
                    if patch:
                        patch_findings = self.scan_text(patch, f"{repo_full_name} commit {sha[:7]} ({filename})")
                        findings.extend(patch_findings)

            time.sleep(0.1)

        return findings

    def scan_repositories(self, limit: Optional[int] = 20) -> Dict[str, Any]:
        """Scan active repositories owned by the user for exposed secrets."""
        all_repos = self.client.paginate("/user/repos?type=owner&sort=updated", per_page=100)
        if limit:
            all_repos = all_repos[:limit]

        summary = {
            "repos_scanned": len(all_repos),
            "findings_count": 0,
            "clean_repos": 0,
            "flagged_repos": 0,
            "findings": []
        }

        print(f"[SecretScanner] Scanning {len(all_repos)} recently active repositories for secret leaks...")
        for idx, repo in enumerate(all_repos, 1):
            full_name = repo["full_name"]
            print(f"[{idx}/{len(all_repos)}] Scanning {full_name}...", end=" ", flush=True)

            repo_findings = self.scan_recent_commits(full_name, max_commits=5)
            if repo_findings:
                print(f"-> WARNING: {len(repo_findings)} potential secret(s) found!")
                summary["flagged_repos"] += 1
                summary["findings_count"] += len(repo_findings)
                summary["findings"].extend(repo_findings)
            else:
                print("-> CLEAN")
                summary["clean_repos"] += 1

            time.sleep(0.1)

        return summary
