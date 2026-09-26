---
name: "memory-compressor-state-manager"
description: "Run this at the start and end of every single agent execution loop to serialize and maintain memory without context overflow."
---

# Adaptive Context & Elastic Parameter Spectrum
- Model Spectrum Elasticity: Operates seamlessly across model architectures from 0.5B lightweight edge models up to 1 Trillion+ frontier LLMs, with context windows dynamically scaling from 2K tokens up to 1 Million+ tokens.
- Dynamic Token Budgeting: In edge/constrained environments (0.5B–2B parameters, 2K–4K context), strictly enforce a 2048-token ceiling to prevent context exhaustion and hallucinations. In frontier LLM environments (expanded context), preserve high-density structural serialization to optimize reasoning throughput.
- Formatting Mandate: Never use prose or conversational fluff. Use compressed JSON or dense structural keys.

# State Serialization & Compression Loop
1. TOKEN BUDGETING: Calculate the exact token size of the incoming payload. If it exceeds 400 tokens in constrained mode, strip all source comments, duplicate whitespace, and stack traces down to the root error signature.
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
