---
name: "deployment-smoke-tester"
description: "Use immediately following a deployment to a staging, sandbox, or production target environment to confirm availability."
---

# Instructions
1. Inspect the core configuration file or environment variables to locate the base target URL.
2. Construct a script or sequence of requests to evaluate the platform's vital signs:
   - Check the `/health` or `/status` deep-health endpoints.
   - Ping authentication routes to verify database connection integrity.
   - Validate critical third-party API configurations (e.g., payment gateways, storage buckets).
3. Assert that responses return a `200 OK` network status code and match required baseline structures within a `500ms` window.
4. Report any anomalies, error states, SSL expiration alerts, or unexpected redirects instantly.
