#!/usr/bin/env python3
"""
GitHub Guardian - Master Automated Maintenance & Security Agent.
Repeats daily PR reviews, auto-merges clean PRs, fixes/rebases conflicts,
syncs forked repos with upstream, scans for exposed secrets, and hardens repo security.
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
from github_client import GitHubClient
from pr_engine import PREngine
from fork_sync import ForkSyncEngine
from secret_scanner import SecretScanner
from security_hardener import SecurityHardener


class GitHubGuardian:
    def __init__(self, token: str = None):
        self.client = GitHubClient(token=token)
        self.username = self.client.get_user_login()
        self.pr_engine = PREngine(self.client)
        self.fork_sync = ForkSyncEngine(self.client)
        self.secret_scanner = SecretScanner(self.client)
        self.security_hardener = SecurityHardener(self.client)
        self.report_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
        os.makedirs(self.report_dir, exist_ok=True)

    def run_all(self, pr_limit: int = 50, fork_limit: int = None, secret_limit: int = 25, harden_limit: int = 30):
        start_time = datetime.now()
        timestamp = start_time.strftime("%Y-%m-%d %H:%M:%S UTC")
        file_ts = start_time.strftime("%Y%m%d_%H%M%S")

        print("=" * 65)
        print(f"🛡️  GITHUB GUARDIAN AGENT - DAILY MAINTENANCE RUN")
        print(f"Account: @{self.username} | Started: {timestamp}")
        print("=" * 65)

        # 1. PR Reviews & Auto-Merge
        print("\n--- [STEP 1/4] Reviewing & Completing Pull Requests ---")
        pr_results = self.pr_engine.process_all_open_prs(limit=pr_limit)

        # 2. Fork Synchronization
        print("\n--- [STEP 2/4] Synchronizing Forked Repositories ---")
        fork_results = self.fork_sync.sync_all_forks(limit=fork_limit)

        # 3. Secret Leakage Scanner
        print("\n--- [STEP 3/4] Scanning for Exposed Secrets & Tokens ---")
        secret_results = self.secret_scanner.scan_repositories(limit=secret_limit)

        # 4. Security Hardening
        print("\n--- [STEP 4/4] Hardening Repository Security Settings ---")
        harden_results = self.security_hardener.harden_all_repositories(limit=harden_limit)

        end_time = datetime.now()
        duration_sec = int((end_time - start_time).total_seconds())

        report_data = {
            "timestamp": timestamp,
            "duration_seconds": duration_sec,
            "account": self.username,
            "pull_requests": pr_results,
            "fork_sync": fork_results,
            "secret_scan": secret_results,
            "security_hardening": harden_results,
        }

        # Save JSON
        json_path = os.path.join(self.report_dir, f"guardian_report_{file_ts}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)

        # Save Markdown Summary
        md_path = os.path.join(self.report_dir, f"guardian_report_{file_ts}.md")
        md_content = self._generate_markdown_report(report_data)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)

        print("\n" + "=" * 65)
        print("✅  GUARDIAN RUN COMPLETED SUCCESSFULLY")
        print(f"⏱️  Duration: {duration_sec}s")
        print(f"📄  Report saved: {md_path}")
        print("=" * 65)
        print(md_content)
        return report_data

    def _generate_markdown_report(self, data: dict) -> str:
        prs = data["pull_requests"]
        forks = data["fork_sync"]
        sec = data["secret_scan"]
        hard = data["security_hardening"]

        return f"""# 🛡️ GitHub Guardian Run Summary
**Account:** @{data['account']}  
**Timestamp:** {data['timestamp']}  
**Execution Time:** {data['duration_seconds']}s  

---

### 1. 🔀 Pull Request Review & Auto-Merge
- **Total PRs Evaluated:** {prs['total_found']}
- **Squash-Merged:** {prs['merged']}
- **Dependabot Rebases Sent (Conflicts):** {prs['rebased']}
- **Closed (Empty/Obsolete):** {prs['closed']}
- **Conflicts Requiring Attention:** {prs['conflicts']}
- **Failed / Blocked:** {prs['failed']}

### 2. 🍴 Fork Synchronization
- **Total Forks Scanned:** {forks['total_forks']}
- **Fast-Forwarded / Synced:** {forks['synced']}
- **Already Up-to-Date:** {forks['up_to_date']}
- **Merge Conflicts:** {forks['conflicts']}
- **Errors / Unavailable:** {forks['errors']}

### 3. 🔐 Secret & Token Leakage Scanner
- **Repositories Scanned:** {sec['repos_scanned']}
- **Clean Repositories:** {sec['clean_repos']}
- **Flagged Repositories:** {sec['flagged_repos']}
- **Exposed Secret Findings:** {sec['findings_count']}

### 4. 🛡️ Security Hardening & Dependency Defense
- **Repositories Hardened:** {hard['repos_processed']}
- **Dependabot Alerts Active:** {hard['alerts_enabled']}
- **Automated Fixes Active:** {hard['fixes_enabled']}
- **Total Open Vulnerabilities Found:** {hard['total_open_vulnerabilities']}
"""


def main():
    parser = argparse.ArgumentParser(description="GitHub Guardian Automated Maintenance Agent")
    parser.add_argument("command", choices=["run-all", "review-prs", "sync-forks", "scan-secrets", "harden", "daemon", "install-cron"], help="Action to execute")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of items to process")
    parser.add_argument("--interval-hours", type=int, default=24, help="Daemon repeat interval in hours")
    args = parser.parse_args()

    agent = GitHubGuardian()

    if args.command == "run-all":
        agent.run_all(pr_limit=args.limit or 50, fork_limit=args.limit, secret_limit=args.limit or 20, harden_limit=args.limit or 25)

    elif args.command == "review-prs":
        summary = agent.pr_engine.process_all_open_prs(limit=args.limit or 50)
        print("\nPR Summary:", json.dumps({k: v for k, v in summary.items() if k != "details"}, indent=2))

    elif args.command == "sync-forks":
        summary = agent.fork_sync.sync_all_forks(limit=args.limit)
        print("\nFork Sync Summary:", json.dumps({k: v for k, v in summary.items() if k != "details"}, indent=2))

    elif args.command == "scan-secrets":
        summary = agent.secret_scanner.scan_repositories(limit=args.limit or 20)
        print("\nSecret Scan Summary:", json.dumps({k: v for k, v in summary.items() if k != "findings"}, indent=2))

    elif args.command == "harden":
        summary = agent.security_hardener.harden_all_repositories(limit=args.limit or 30)
        print("\nSecurity Hardener Summary:", json.dumps({k: v for k, v in summary.items() if k != "details"}, indent=2))

    elif args.command == "daemon":
        interval_seconds = args.interval_hours * 3600
        print(f"🚀 Launching GitHub Guardian Daemon (Runs every {args.interval_hours} hours / {interval_seconds}s)...")
        while True:
            try:
                agent.run_all(pr_limit=50, fork_limit=None, secret_limit=25, harden_limit=30)
            except Exception as e:
                print(f"[Daemon Error] Run encountered error: {e}")
            print(f"\n💤 Sleeping for {args.interval_hours} hours until next daily maintenance run...")
            time.sleep(interval_seconds)

    elif args.command == "install-cron":
        cron_script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "install_cron.sh")
        os.system(f"bash {cron_script}")


if __name__ == "__main__":
    main()
