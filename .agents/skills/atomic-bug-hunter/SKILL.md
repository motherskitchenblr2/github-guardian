---
name: "atomic-bug-hunter"
description: "Run whenever test assertions fail or unexpected exceptions are caught during pipeline execution steps."
---

# Pinpoint Boundary Rule
- Max input allowance: 1 runtime exception stack trace snippet + exactly 1 target function scope block (max 40 lines).

# Root Cause Diagnostics
1. TRACE ANALYSIS: Parse the input stack trace to extract the exact filename, line number, and column position where the runtime error originated. Reject any files outside this traceback block.
2. REASONING BOUNDARY: Inspect the isolated function block for common logic flaws:
   - Off-by-one indices, type mismatches (`undefined` / `null` property accesses), unhandled array lookups.
3. CORRECTION INJECTION: Draft an isolated patch containing a defensive guard clause or fallback mechanism targeting only the line of failure.
4. REGRESSION PROTECTION: Output the unified git diff block accompanied by a 1-line verification check requirement (e.g., `Assert that target object is not null before checking property`).
