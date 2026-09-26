---
name: "automated-testing-matrix"
description: "Run immediately following code generation, architectural updates, or during the orchestration phase to validate runtime integrity."
---

# Domain Context Boundaries
- Test Stack Context: Unit, integration, end-to-end (E2E), and contract test layers.

# Advanced Matrix Verification Steps
1. DELTA COVERAGE CHECK: Calculate precise code coverage drops in the modified files. Identify any newly introduced logic branches lacking corresponding test paths.
2. FLAKINESS & TIMING AUDIT: Analyze test blocks for anti-patterns that introduce non-deterministic results (e.g., loose timeouts, shared state, unawaited promises, hardcoded system clock dependencies).
3. MOCK INTEGRITY AUDIT: Verify that all internal and network-level mocking structures mirror current API payloads. Ensure external network queries are strictly caught at the boundary.
4. BOUNDARY & ERROR-PATH ANALYSIS: Enforce explicit test assertions for classic failure modes, including null values, rapid-fire network dropouts, database connection timeouts, and integer boundary overflows.
5. MUTATION RESILIENCE REPORT: Output an executive testing matrix mapping:
   - Covered vs. Blind Logic Paths
   - Discovered Boundary Flaws
   - Total Pipeline Execution Risk Index (LOW/MED/CRITICAL)
