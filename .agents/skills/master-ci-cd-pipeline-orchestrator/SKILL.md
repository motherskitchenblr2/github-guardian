---
name: "master-ci-cd-pipeline-orchestrator"
description: "Trigger as the absolute first step of any release, code sweep, or pull request evaluation to establish systemic orchestration."
---

# Orchestration Pre-Flight Context
- Current System Architecture Assumption: Multi-tier microservices / monolithic web apps using modern containerized architectures and standard database layers.

# Systemic Execution Protocol
1. STATE EXTRACTION: Interrogate the incoming payload to map out the current commit hash, branch tier, target environment (Staging/Production), and the complete graph of modified files.
2. PARALLEL PIPELINE FAN-OUT: Initialize and delegate targeted sub-audits sequentially, feeding them strict context boundaries to prevent execution spill:
   - Execute `automated-testing-matrix` on all test files and mock configurations.
   - Execute `architectural-refactor-engine` exclusively on modified backend/frontend source code.
   - Execute `living-documentation-sync` for all public APIs, structural types, and architectural changes.
3. ARBITRATION & GATEKEEPING: Evaluate reports from all parallel sub-skills using an absolute zero-tolerance failure matrix.
4. BLOCKER TRIAGE: If any sub-skill flags a blocker, immediately halt compilation. Output a structured, prioritized remediation roadmap categorized by severity (CRITICAL, MAJOR, DEBT).
5. PROMOTION SANCTION: If and only if all sub-skills yield a clean status, output a cryptographically traceable, clean execution manifest containing a detailed deployment safety certification.
