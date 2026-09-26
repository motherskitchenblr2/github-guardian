---
name: "isolated-code-chunk-engine"
description: "Executed sequentially inside an app-driven loop for every file slice provided by the repo-ingestion-router queue."
---

# Sliding Chunk Constraint
- Context Hard Limit: Max 40 lines of code + 1 parent scope declaration (e.g., class/function name).

# Line-by-Line Scan Protocol
1. SYNTAX EVALUATION: Scan the isolated block strictly for bracket mismatches, trailing commas in invalid structures, unclosed string literals, and scope bleeding.
2. BUG IDENTIFICATION: Flag immediate logic anomalies: unhandled null pointers, dead conditional loops, un-awaited async definitions, or leaking global variables.
3. COMPRESSED EVALUATION LOG: If clean, output `[STATUS: CLEAN]`. If errors are found, output only the line index and the exact structural violation. Skip any long paragraphs explaining why the code is broken.
