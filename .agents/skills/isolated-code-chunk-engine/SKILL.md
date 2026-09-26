---
name: "isolated-code-chunk-engine"
description: "Executed sequentially inside an app-driven loop for every file slice provided by the repo-ingestion-router queue."
---

# Adaptive Sliding Chunk Architecture
- Elastic Slicing Protocol: Scales across 0.5B edge models up to 1 Trillion+ frontier LLMs (2K to 1M+ context). In constrained mode, processes atomic 40-line sliding slices + 1 parent scope declaration (class/function) to eliminate hallucination; in expanded frontier LLM mode, dynamically adjusts chunk window up to full functional blocks while preserving pinpoint verification.

# Line-by-Line Scan Protocol
1. SYNTAX EVALUATION: Scan the isolated block strictly for bracket mismatches, trailing commas in invalid structures, unclosed string literals, and scope bleeding.
2. BUG IDENTIFICATION: Flag immediate logic anomalies: unhandled null pointers, dead conditional loops, un-awaited async definitions, or leaking global variables.
3. COMPRESSED EVALUATION LOG: If clean, output `[STATUS: CLEAN]`. If errors are found, output only the line index and the exact structural violation. Skip any long paragraphs explaining why the code is broken.
