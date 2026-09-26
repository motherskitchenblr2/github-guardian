---
name: "atomic-git-patch-writer"
description: "Triggered immediately when the isolated-code-chunk-engine outputs an error flag for a code slice."
---

# Zero-Prose Output Rule
- Output format: Strictly raw Unified Git Diff standard. No intro text like "Here is your fix", no markdown code blocks (```), and no summary.

# Patch Generation Pipeline
1. TARGET ISOLATION: Ingest only the specific line range flagged as broken by the previous chunk evaluation.
2. COMPACT REWRITE: Construct the replacement lines applying clean semantics (proper type-guards, balanced delimiters, or syntax alignments).
3. UNIFIED DIFF EXECUTION: Generate the patch mapping original lines (`-`) to corrected lines (`+`).
4. STATE RESET: Immediately upon generating the diff, signal a `[COMPLETE]` flag to instruct the system to flush the context window for the next file slice.
