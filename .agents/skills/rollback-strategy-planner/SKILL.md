---
name: "rollback-strategy-planner"
description: "Use this alongside your release review whenever a deployment contains breaking infrastructure changes, major dependency bumps, or stateful service updates."
---

# Instructions
1. Evaluate the deployment payload to determine the rollback complexity tier (Stateless, Stateful/Database, or Third-Party breaking change).
2. Map out explicit step-by-step instructions to revert to the previous stable container image tag or commit hash.
3. Formulate the precise strategy for data states (e.g., whether to execute a database rollback script or deploy a backward-compatible "forward-fix").
4. Define clear, quantifiable criteria (SLOs/SLAs) that should instantly trigger a rollback (e.g., HTTP 5xx error rate > 1% for 3 minutes).
5. List dependencies or upstream microservices that must be notified or synchronized during a revert event.
