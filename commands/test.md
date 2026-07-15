---
description: Run tests and report results
---

Run the project's test suite and report results.

1. Detect the test framework:
   - Look for `package.json` scripts (npm test, vitest, jest)
   - Look for `pytest.ini`, `pyproject.toml` (pytest)
   - Look for `Makefile` with test targets
   - Look for `go.mod` (go test)

2. Run the appropriate test command.

3. If tests fail, analyze the failures and suggest fixes.

4. Report:
   - Total tests run
   - Pass/fail/skip counts
   - Failed test names and error messages
   - Suggested fixes for failures
