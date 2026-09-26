---
name: "context-garbage-collector"
description: "Run this automated task asynchronously in the main loop between agent hand-offs."
---

# Garbage Collection Parameters
- Max Allowed State Payload Size: 300 tokens.

# Purging Mechanics
1. METADATA TRUNCATION: Inspect the centralized JSON state object.
2. STALE KEY DELETION: Permanently delete keys related to completed operational stages (e.g., if code is compiled, delete raw compiler error strings; if dependencies are checked, delete old semver strings).
3. HISTORY SQUASHING: If historical steps exist in the array format, squash them down to a single total step count integer (e.g., replace `steps: ["fetched", "parsed", "patched"]` with `steps_completed: 3`).
4. EMIT CLEAN STATE: Output the optimized, pruned state payload back to the database backend.
