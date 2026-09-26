---
name: "memory-hand-off-encoder"
description: "Trigger at the end of an agent's task execution to package the data hand-off cleanly."
---

# Extreme Frugality Constraint
- Output Format: Strictly valid, minified JSON. Zero natural language prose. Zero markdown blocks outside the JSON payload.

# Context Encoding Protocol
1. STATE CONDENSATION: Extract only critical, non-negotiable execution metrics from the active session.
2. DEPENDENCY MAPPING: If a file path was changed, note only the file name, target line range, and mutations status flag. Do not preserve the full code diff.
3. COMPRESSION OUTPUT: Compile and print the state string precisely matching this compressed signature:
   ```json
   {"next_agent":"pr-reviewer","task_status":"success","mutations":[{"file":"src/app.js","lines":"12-14","fix":"syntax_balanced"}],"error_sig":null}
   ```
