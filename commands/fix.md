---
description: Fix failing tests or lint errors
---

Fix failing tests, lint errors, or type errors in the project.

1. Run the test/lint/typecheck command to identify failures.

2. For each failure:
   - Read the error message and stack trace
   - Locate the problematic code
   - Apply the minimal fix

3. Re-run to verify the fix works.

4. Report what was fixed and why.

优先级 (Priority):
1. Type errors (break compilation)
2. Test failures (break CI)
3. Lint errors (code quality)
4. Warnings (non-blocking)
