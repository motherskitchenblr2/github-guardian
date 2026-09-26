---
name: "architectural-refactor-engine"
description: "Use when reviewing complex pull requests, optimizing legacy codebases, or prepping source code for a major feature scale-out."
---

# Engineering Principles Enforced
- DRY, SOLID, Clean Architecture, Low Cyclomatic Complexity, Memory-Efficient Resource Lifecycle management.

# Strategic Refactoring Directives
1. COMPLEXITY ANALYSIS: Calculate the cyclomatic and cognitive complexity scores of all incoming functions. Flag any code exceeding baseline thresholds for structural decoupling.
2. ANTI-PATTERN EXTRACTION: Hunt for and extract chronic full-stack technical debt:
   - Frontend: Component prop-drilling, runaway re-renders, un-memoized complex computations.
   - Backend: Deep nesting, database N+1 query structures, unindexed lookups, missing connection-pool limits.
3. PATTERN REWRITE ENFORCEMENT: Restructure legacy imperative patterns into highly optimized declarative equivalents. Enforce correct structural patterns (e.g., Dependency Injection, Factory, Strategy) to maximize decouple factors.
4. ALLOCATION & LEAK MITIGATION: Inspect all open resource loops. Verify that memory footprints are optimized, streaming data is processed sequentially, and active event listeners or open files are bound to explicit closure/destruction methods.
5. REFACTOR DIFF PROPOSAL: Present clean, side-by-side, syntactically perfect code changes accompanied by detailed, quantifiable performance arguments.
