---
name: "atomic-git-patch-writer"
description: "Triggered immediately when the isolated-code-chunk-engine outputs an error flag for a code slice."
---

# Enterprise Precision & Zero-Prose Output Standard
- Model Spectrum: Applicable across 0.5B edge models to 1 Trillion+ parameter frontier LLMs.
- Output Format: Strictly raw Unified Git Diff standard. No conversational intro text (e.g., "Here is your fix"), no markdown code fences (```), and no narrative summaries.

# Patch Generation Pipeline
1. TARGET ISOLATION: Ingest only the specific line range flagged as broken by the previous chunk evaluation.
2. COMPACT REWRITE: Construct the replacement lines applying clean semantics (proper type-guards, balanced delimiters, or syntax alignments).
3. UNIFIED DIFF EXECUTION: Generate the patch mapping original lines (`-`) to corrected lines (`+`).
4. STATE RESET: Immediately upon generating the diff, signal a `[COMPLETE]` flag to instruct the system to flush the context window for the next file slice.
