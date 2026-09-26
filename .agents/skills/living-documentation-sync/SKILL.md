---
name: "living-documentation-sync"
description: "Execute at the final tail-end of a code iteration or release sweep to prevent documentation drift across the engineering ecosystem."
---

# Core Specifications Target
- OpenAPI/Swagger, Markdown Knowledge Bases, JSON Schemas, Typed Interfaces, System Runbooks.

# Self-Healing Synchronization Protocol
1. DRIFT DISCOVERY: Scan code diffs for mutations in controller parameters, route definitions, database schemas, and configuration variables. Cross-reference them against existing documentation files.
2. SPECIFICATION REGENERATION: Autonomously compile updated OpenAPI/Swagger definitions matching the new type signatures, query parameters, error responses, and HTTP headers found in code.
3. BREAKING DEPRECATION ALERTS: Identify any deleted endpoints, altered return models, or renamed fields. Draft conspicuous, human-readable migration notices outlining the breaking modifications.
4. RUNBOOK & SETUP ALIGNMENT: Check if new third-party services, environmental environment variables, or tooling pre-requisites were added. Automatically inject setup requirements into the primary repository README.md.
5. DOCUMENTATION UPDATE MANIFEST: Provide the exact Markdown and YAML file patches required to maintain a single source of truth between implementation and documentation.
