---
name: "repo-ingestion-router"
description: "Run as the absolute initialization step of a repository-wide audit, scan, or syntax fix."
---

# Tiny Model Context Rule
- Absolute Limit: Ingest ONLY file paths and file sizes. Reject code contents.

# Structural Map Blueprint
1. TREE FILTERING: Ignore directories like `node_modules`, `vendor`, `.git`, `dist`, or build artifacts to save token space.
2. METADATA MINIFICATION: Convert the file directory listing into a micro-JSON layout mapping paths to file extension types:
   ```json
   {"files":["src/main.js","src/utils/math.ts","config/db.json"]}
   ```
3. ROUTING QUEUE GENERATION: Break the list down. Output exactly ONE file path per line to the host environment queue. Do not process files in parallel within the same context window.
