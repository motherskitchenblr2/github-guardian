---
name: "conflict-syntax-resolver"
description: "Use when a PR experiences merge conflicts, syntax validation failures, or safe-merge assertion faults."
---

# Code Chunk Isolation Constraint
- Code Block Boundary: Max 30 lines of source code context around the conflict markers (`<<<<<<<` to `>>>>>>>`) or the syntax error line.

# Surgical Resolution Pipeline
1. MARKER PARSING: Strip away all unaffected code files. Ingest only the isolated 30-line conflict snippet.
2. LINEAGE COMPARISON: Evaluate `HEAD` (Current Branch) changes directly against `Incoming` changes line-by-line:
   - Identify logic deletions, variable renames, and formatting variances.
3. SYNTAX HEALING: Apply localized corrections to balance open delimiters (parentheses, braces, brackets) and fix misaligned indentation boundaries within the chunk.
4. ATOMIC PATCH GENERATION: Output exclusively a unified standard Git Diff patch. Do not add explanations, conversational commentary, or a summary of changes.
