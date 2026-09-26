---
name: "secret-and-compliance-scanner"
description: "Trigger this skill automatically on every commit, pull request, or release configuration update before code compilation."
---

# Domain Target
- Credentials, Private Keys, Cloud Tokens, .gitignore / .dockerignore integrity, CVE catalogs.

# Scanning & Compliance Lifecycle
1. Scan all incoming code diffs, configuration blocks, text templates, and environment sample files.
2. Check for high-entropy strings, hardcoded credentials, private certificates, SSH keys, or known API key formats (AWS, Stripe, OpenAI, etc.).
3. Validate that `.gitignore` and dockerignore patterns are applied properly to block local environment variables from being tracked.
4. Cross-reference changed dependencies against known vulnerability databases (like CVE catalogs) to catch high-severity exploits.
5. If any secret or major vulnerability is uncovered, halt the process immediately, mask the secret in the output log, and raise a critical blocker ticket.
