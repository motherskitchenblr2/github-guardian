---
name: "performance-regression-check"
description: "Trigger when reviewing pull requests or release builds containing heavy data processing logic, new external API calls, or changes to core loops and middleware."
---

# Instructions
1. Inspect changed files for structural performance risks, such as nested loops, redundant database queries (N+1 queries), or missing caching layers.
2. Flag any missing execution timeouts on network requests, database connections, or file I/O operations.
3. Identify massive object allocations, unclosed streams, or global state mutations that could introduce memory leaks under high traffic.
4. Evaluate if asynchronous patterns (Promises, async/await, worker threads) are leveraged correctly for non-blocking operations.
5. Summarize the expected resource impact and recommend optimization tweaks or explicit profiling steps.
