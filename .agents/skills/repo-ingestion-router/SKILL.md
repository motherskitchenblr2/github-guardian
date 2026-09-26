---
name: "repo-ingestion-router"
description: "Run as the absolute initialization step of a repository-wide audit, scan, or syntax fix."
---

# Elastic Repository Ingestion Rules
- Model & Context Elasticity: Engineered for models from 0.5B parameters up to 1 Trillion+ frontier LLMs, adapting from 2K tokens up to 1 Million+ token windows.
- Structural Ingestion Boundary: Ingest ONLY file paths and file sizes. Reject code contents during mapping to ensure deterministic, zero-token-waste routing regardless of model scale.

# Structural Map Blueprint
1. TREE FILTERING: Ignore directories like `node_modules`, `vendor`, `.git`, `dist`, or build artifacts to save token space.
2. METADATA MINIFICATION: Convert the file directory listing into a micro-JSON layout mapping paths to file extension types:
   ```json
   {"files":["src/main.js","src/utils/math.ts","config/db.json"]}
   ```
3. ROUTING QUEUE GENERATION: Break the list down. Output exactly ONE file path per line to the host environment queue. Do not process files in parallel within the same context window.
