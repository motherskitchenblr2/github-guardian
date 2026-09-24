#!/usr/bin/env python3
"""
GitHub Guardian - Fork Synchronizer Engine.
Scans all forked repositories owned by the user and syncs their default branch
with the parent upstream repository using GitHub's merge-upstream API.
"""

import time
from typing import Any, Dict, List, Optional
from github_client import GitHubClient


class ForkSyncEngine:
    def __init__(self, client: GitHubClient):
        self.client = client
        self.username = client.get_user_login()

    def get_all_forks(self) -> List[Dict[str, Any]]:
        """Fetch all forked repositories owned by the user."""
        all_repos = self.client.paginate("/user/repos?type=owner", per_page=100)
        return [r for r in all_repos if r.get("fork")]

    def sync_fork(self, repo_full_name: str, branch: Optional[str] = None) -> Dict[str, Any]:
        """Sync a fork with its upstream parent."""
        if not branch:
            status, repo_info = self.client.get(f"/repos/{repo_full_name}")
            if status == 200 and isinstance(repo_info, dict):
                branch = repo_info.get("default_branch", "main")
            else:
                branch = "main"

        url = f"/repos/{repo_full_name}/merge-upstream"
        status, resp = self.client.post(url, {"branch": branch})

        result = {
            "repo": repo_full_name,
            "branch": branch,
            "status_code": status,
            "result": "unknown",
            "message": ""
        }

        if status == 200 and isinstance(resp, dict):
            msg = resp.get("message", "")
            result["message"] = msg
            if "not behind" in msg.lower():
                result["result"] = "up_to_date"
            elif "fast-forwarded" in msg.lower() or "merged" in msg.lower():
                result["result"] = "synced"
            else:
                result["result"] = "synced"
        elif status == 409:
            result["result"] = "conflict"
            result["message"] = "Merge conflicts prevent automatic upstream sync."
        elif status == 422:
            result["result"] = "unprocessable"
            result["message"] = resp.get("message", "Upstream branch unavailable or unprocessable.")
        else:
            result["result"] = "error"
            result["message"] = resp.get("message", str(resp)) if isinstance(resp, dict) else str(resp)

        return result

    def sync_all_forks(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """Sync all forks and return an aggregate report."""
        forks = self.get_all_forks()
        if limit:
            forks = forks[:limit]

        summary = {
            "total_forks": len(forks),
            "synced": 0,
            "up_to_date": 0,
            "conflicts": 0,
            "errors": 0,
            "details": []
        }

        print(f"[ForkSync] Found {len(forks)} forked repositories to synchronize...")
        for idx, fork in enumerate(forks, 1):
            full_name = fork["full_name"]
            branch = fork.get("default_branch", "main")
            print(f"[{idx}/{len(forks)}] Syncing {full_name} ({branch})...", end=" ", flush=True)

            res = self.sync_fork(full_name, branch)
            res_type = res["result"]
            print(f"-> {res_type.upper()} ({res['message']})")

            summary["details"].append(res)
            if res_type == "synced":
                summary["synced"] += 1
            elif res_type == "up_to_date":
                summary["up_to_date"] += 1
            elif res_type == "conflict":
                summary["conflicts"] += 1
            else:
                summary["errors"] += 1

            time.sleep(0.2)

        return summary
