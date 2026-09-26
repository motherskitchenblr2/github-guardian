---
name: "state-hydration-filter"
description: "Execute as the absolute first step when initializing any agent in the multi-agent pool."
---

# Memory Isolation Boundary
- Never look back at historical agent logs or past conversational execution lines. Trust only the current inbound hydration block.

# Hydration Protocol
1. SCOPE ISOLATION: Parse the system-provided minified JSON hand-off token.
2. LOCAL ENVIRONMENT RESTRICTION: Extract the target file path and line numbers specified in the hand-off.
3. GIT TARGET FETCH: Restrict the environment tool to load *only* the specific lines of code defined in the state object. Reject requests to read the entire file repository or parent directories.
4. STATE ACKNOWLEDGEMENT: Output a single 1-token confirmation flag: `[READY]` to proceed to execution.
