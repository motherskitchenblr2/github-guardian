#!/usr/bin/env python3
"""
GitHub Guardian - Pull Request Review & Auto-Merge Engine.
Reviews pending PRs, detects merge conflicts, auto-squash-merges clean PRs,
triggers Dependabot rebases for dirty dependency PRs, and closes obsolete PRs.
"""

import time
from typing import Any, Dict, List, Optional
from github_client import GitHubClient


class PREngine:
    def __init__(self, client: GitHubClient):
        self.client = client
        self.username = client.get_user_login()

    def get_all_open_prs(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Search all open PRs owned by the user."""
        all_prs = []
        page = 1
        query = f"is:open+is:pr+user:{self.username}"

        while True:
            url = f"/search/issues?q={query}&per_page=100&page={page}"
            status, data = self.client.get(url)
            if status != 200 or not isinstance(data, dict):
                break
            items = data.get("items", [])
            all_prs.extend(items)

            if limit and len(all_prs) >= limit:
                all_prs = all_prs[:limit]
                break

            if len(all_prs) >= data.get("total_count", 0) or not items:
                break
            page += 1

        return all_prs

    def get_pr_details(self, repo_full_name: str, pr_number: int, wait_for_mergeable: bool = True) -> Dict[str, Any]:
        """Fetch detailed PR status, waiting if mergeable status is pending."""
        url = f"/repos/{repo_full_name}/pulls/{pr_number}"
        status, pr = self.client.get(url)
        if status != 200 or not isinstance(pr, dict):
            return {}

        # GitHub calculates mergeability asynchronously
        if wait_for_mergeable and pr.get("mergeable") is None:
            for _ in range(3):
                time.sleep(1.5)
                status, pr = self.client.get(url)
                if pr.get("mergeable") is not None:
                    break

        return pr

    def review_and_process_pr(self, repo_full_name: str, pr_number: int) -> Dict[str, Any]:
        """Review an individual PR and take the appropriate automated action."""
        pr = self.get_pr_details(repo_full_name, pr_number)
        if not pr:
            return {"action": "error", "message": "Failed to fetch PR details"}

        title = pr.get("title", "")
        author = pr.get("user", {}).get("login", "")
        is_dependabot = author == "dependabot[bot]"
        is_clean = pr.get("mergeable") is True
        mergeable_state = pr.get("mergeable_state", "unknown")
        changed_files = pr.get("changed_files", 0)
        html_url = pr.get("html_url", "")

        result = {
            "repo": repo_full_name,
            "number": pr_number,
            "title": title,
            "author": author,
            "url": html_url,
            "action": "skipped",
            "reason": ""
        }

        # Case 1: Empty PR (0 changed files)
        if changed_files == 0:
            merge_status, merge_resp = self.client.put(
                f"/repos/{repo_full_name}/pulls/{pr_number}/merge",
                {"merge_method": "squash", "commit_title": f"{title} (#{pr_number})"}
            )
            if merge_status == 200:
                result["action"] = "merged_empty"
                result["reason"] = "Squash-merged 0-change PR to complete lifecycle"
                return result
            else:
                close_status, _ = self.client.patch(
                    f"/repos/{repo_full_name}/pulls/{pr_number}",
                    {"state": "closed"}
                )
                result["action"] = "closed_empty"
                result["reason"] = "Closed PR with 0 modified files"
                return result

        # Case 2: Clean & Mergeable PR (Dependabot or automated safe bumps)
        if is_clean and mergeable_state in ("clean", "unstable", "has_hooks"):
            commit_title = f"{title} (#{pr_number})"
            commit_msg = f"Auto-merged via GitHub Guardian Agent\nAuthor: @{author}"
            merge_status, merge_resp = self.client.put(
                f"/repos/{repo_full_name}/pulls/{pr_number}/merge",
                {
                    "merge_method": "squash",
                    "commit_title": commit_title,
                    "commit_message": commit_msg,
                }
            )
            if merge_status == 200:
                result["action"] = "merged"
                result["reason"] = f"Successfully squash-merged (state: {mergeable_state})"
            elif merge_status == 405 and is_dependabot:
                # GitHub detected merge conflicts upon merge attempt
                comment_url = f"/repos/{repo_full_name}/issues/{pr_number}/comments"
                self.client.post(comment_url, {"body": "@dependabot rebase"})
                result["action"] = "rebased"
                result["reason"] = "Merge conflict detected on attempt: Triggered @dependabot rebase"
            else:
                result["action"] = "merge_failed"
                msg = merge_resp.get("message") if isinstance(merge_resp, dict) else str(merge_resp)
                result["reason"] = f"HTTP {merge_status}: {msg}"
            return result

        # Case 3: Merge conflict / Dirty PR
        if pr.get("mergeable") is False or mergeable_state == "dirty":
            if is_dependabot:
                # Trigger Dependabot rebase
                comment_url = f"/repos/{repo_full_name}/issues/{pr_number}/comments"
                c_status, _ = self.client.post(comment_url, {"body": "@dependabot rebase"})
                if c_status in (200, 201):
                    result["action"] = "rebased"
                    result["reason"] = "Conflict detected: Triggered @dependabot rebase"
                else:
                    result["action"] = "rebase_failed"
                    result["reason"] = "Failed to post @dependabot rebase comment"
            else:
                result["action"] = "conflict_detected"
                result["reason"] = f"Branch in conflict with base. Manual/git resolution required."
            return result

        # Case 4: Other / Pending / Blocked
        result["action"] = "pending"
        result["reason"] = f"Mergeable: {pr.get('mergeable')}, state: {mergeable_state}"
        return result

    def process_all_open_prs(self, limit: Optional[int] = 50) -> Dict[str, Any]:
        """Process open PRs up to limit and return aggregate summary."""
        raw_prs = self.get_all_open_prs(limit=limit)
        summary = {
            "total_found": len(raw_prs),
            "merged": 0,
            "rebased": 0,
            "closed": 0,
            "conflicts": 0,
            "failed": 0,
            "skipped": 0,
            "details": []
        }

        print(f"[PREngine] Processing {len(raw_prs)} open pull requests...")
        for idx, item in enumerate(raw_prs, 1):
            repo = item.get("repository_url", "").replace("https://api.github.com/repos/", "")
            num = item.get("number")
            print(f"[{idx}/{len(raw_prs)}] Evaluating {repo} #{num}...", end=" ", flush=True)

            res = self.review_and_process_pr(repo, num)
            action = res.get("action", "")
            print(f"-> {action.upper()} ({res.get('reason')})")

            summary["details"].append(res)
            if "merged" in action:
                summary["merged"] += 1
            elif "rebased" in action:
                summary["rebased"] += 1
            elif "closed" in action:
                summary["closed"] += 1
            elif "conflict" in action:
                summary["conflicts"] += 1
            elif "failed" in action:
                summary["failed"] += 1
            else:
                summary["skipped"] += 1

            # Mild rate-limiting buffer
            time.sleep(0.3)

        return summary
