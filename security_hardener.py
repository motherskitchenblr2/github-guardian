#!/usr/bin/env python3
"""
GitHub Guardian - Security Hardener & Vulnerability Protection.
Enables Dependabot security alerts, automated vulnerability fixes,
and audits open security advisories across repositories.
"""

import time
from typing import Any, Dict, List, Optional
from github_client import GitHubClient


class SecurityHardener:
    def __init__(self, client: GitHubClient):
        self.client = client
        self.username = client.get_user_login()

    def harden_repository(self, repo_full_name: str) -> Dict[str, Any]:
        """Enable vulnerability alerts and automated security fixes for a repository."""
        res = {
            "repo": repo_full_name,
            "vulnerability_alerts": False,
            "automated_fixes": False,
            "open_alerts": 0,
            "notes": ""
        }

        # 1. Enable vulnerability alerts
        va_status, _ = self.client.put(f"/repos/{repo_full_name}/vulnerability-alerts")
        if va_status in (204, 200):
            res["vulnerability_alerts"] = True

        # 2. Enable automated security fixes
        af_status, _ = self.client.put(f"/repos/{repo_full_name}/automated-security-fixes")
        if af_status in (204, 200):
            res["automated_fixes"] = True

        # 3. Check for open dependabot alerts if accessible
        al_status, alerts = self.client.get(f"/repos/{repo_full_name}/dependabot/alerts?state=open&per_page=10")
        if al_status == 200 and isinstance(alerts, list):
            res["open_alerts"] = len(alerts)

        return res

    def harden_all_repositories(self, limit: Optional[int] = 30) -> Dict[str, Any]:
        """Harden security across owned repositories."""
        all_repos = self.client.paginate("/user/repos?type=owner&sort=updated", per_page=100)
        if limit:
            all_repos = all_repos[:limit]

        summary = {
            "repos_processed": len(all_repos),
            "alerts_enabled": 0,
            "fixes_enabled": 0,
            "total_open_vulnerabilities": 0,
            "details": []
        }

        print(f"[SecurityHardener] Hardening security settings for {len(all_repos)} repositories...")
        for idx, repo in enumerate(all_repos, 1):
            full_name = repo["full_name"]
            print(f"[{idx}/{len(all_repos)}] Hardening {full_name}...", end=" ", flush=True)

            res = self.harden_repository(full_name)
            if res["vulnerability_alerts"]:
                summary["alerts_enabled"] += 1
            if res["automated_fixes"]:
                summary["fixes_enabled"] += 1
            summary["total_open_vulnerabilities"] += res["open_alerts"]
            summary["details"].append(res)

            print(f"-> Alerts: {'ON' if res['vulnerability_alerts'] else 'SKIP'}, Fixes: {'ON' if res['automated_fixes'] else 'SKIP'}")
            time.sleep(0.1)

        return summary
