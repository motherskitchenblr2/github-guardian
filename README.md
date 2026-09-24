# 🛡️ GitHub Guardian Agent

An autonomous GitHub maintenance, security, and repository synchronization agent. Built to keep all repositories safe, up-to-date, free of merge conflicts, protected against credential leakage, and dependencies patched.

---

## 🚀 Key Capabilities

1. **Automated Pull Request Review & Auto-Merge**
   - Automatically inspects open pull requests across all repositories.
   - Squash-merges clean dependency updates and safe pull requests.
   - Detects merge conflicts and triggers `@dependabot rebase` or handles lifecycle cleanup.
   - Identifies and closes or squashes obsolete or 0-diff pull requests.

2. **Fork Synchronization Engine**
   - Discovers all forked repositories (190+ forks).
   - Fast-forwards / merges default branches directly from upstream parents via GitHub's `merge-upstream` API.
   - Detects and flags any upstream conflict or divergence.

3. **Secret & Credential Leakage Scanner**
   - Scans commits, file diffs, and repository contents for accidental leaks:
     - GitHub Personal Access Tokens (`ghp_`, `github_pat_`)
     - OpenAI API Keys (`sk-...`)
     - Anthropic API Keys (`sk-ant-...`)
     - Google / Gemini API Keys (`AIzaSy...`)
     - AWS Access Keys & Secrets
     - Private RSA / SSH Keys
     - Committed `.env` files with sensitive credentials.
   - Automatically masks tokens in logs to prevent secondary exposure.

4. **Security Hardening & Dependency Defense**
   - Enables GitHub Dependabot vulnerability alerts.
   - Activates automated security fixes across repositories.
   - Audits open CVEs and security advisories.

5. **Everyday Automation**
   - Runs on-demand or as a background 24-hour daemon.
   - Includes Termux boot autostart hook.
   - Includes GitHub Actions cloud workflow for scheduled serverless daily execution.

---

## 🛠️ Quick Usage

From the `~/github-guardian` directory:

```bash
# Run full maintenance suite (PR review, fork sync, secret scan, hardening)
python3 guardian.py run-all

# Review and squash-merge open PRs (process next 50)
python3 guardian.py review-prs --limit 50

# Sync all forked repositories with upstream
python3 guardian.py sync-forks

# Scan repositories for leaked secrets & API keys
python3 guardian.py scan-secrets --limit 30

# Harden security settings on repositories
python3 guardian.py harden --limit 30

# Launch 24-hour background daemon
python3 guardian.py daemon --interval-hours 24

# Install daily autostart hook
python3 guardian.py install-cron
```

---

## 📊 Reports

Every run automatically records structured JSON and human-readable Markdown summaries in `~/github-guardian/reports/`:
- `guardian_report_<timestamp>.md`
- `guardian_report_<timestamp>.json`
