---
name: "release-review-generator"
description: "Use when preparing a new release version, tagging a deployment build, or summarizing merged changes for the changelog."
---

# Instructions
1. Analyze all commit messages and PR bodies since the last production tag/version.
2. Categorize all changes into four distinct sections:
   - 🚀 Features (User-facing enhancements)
   - 🐛 Bug Fixes (Resolved issues)
   - 🛠️ Maintenance (Refactors, dependencies, CI/CD updates)
   - ⚠️ Breaking Changes (Deprecations or API alterations)
3. Extract security updates and explicitly flag any dependency updates fixing vulnerabilities.
4. Format the output into standard GitHub Markdown format (CHANGELOG.md compatible) with a concise, non-technical executive summary at the top.
