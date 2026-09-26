---
name: "memory-compressor-state-manager"
description: "Run this at the start and end of every single agent execution loop to serialize and maintain memory without context overflow."
---

# Tiny Model Context Constraint Rules
- Context Hard Limit: 2048 tokens absolute.
- Formatting Mandate: Never use prose or conversational fluff. Use compressed JSON or dense markdown keys.

# State Serialization & Compression Loop
1. TOKEN BUDGETING: Calculate the exact token size of the incoming payload. If it exceeds 400 tokens, strip all source comments, duplicate whitespace, and stack traces down to the root error signature.
2. COMPRESSED MEMORY MAP: Update and maintain the `Active State` using this exact structure:
   ```json
   {
     "repo": "owner/name",
     "pr": 102,
     "focus_file": "src/auth.ts",
     "target_lines": "45-52",
     "last_error": "SyntaxError: Unexpected token",
     "last_action": "git_apply_patch",
     "conflict_files": ["package.json"]
   }
   ```
3. EPHEMERAL SLIDING WINDOW: Purge any variables or historical steps older than 2 iterations. Retain only the *current* state and the *immediate previous* execution outcome.
4. STATE INJECTION MANIFEST: Output only the compressed JSON block. This block will serve as the exclusive context header for all subsequent agent skill invocations.
