---
name: "migration-safety-audit"
description: "Trigger this skill automatically whenever new SQL files, ORM migration scripts, or schema alteration files are detected in a release."
---

# Instructions
1. Locate all new migration scripts in the codebase.
2. Audit each script for known database anti-patterns:
   - Table locks or heavy row operations on high-traffic tables.
   - Adding non-nullable columns without safe defaults.
   - Missing indexes on newly added foreign key references.
3. Verify that a programmatic `down` or `rollback` mechanism exists for every `up` modification.
4. Ensure that data mutations are batched to prevent transaction timeouts or blocking the replication log.
5. Output a status report categorizing risks as LOW, MEDIUM, or HIGH, accompanied by structural rewrite suggestions.
