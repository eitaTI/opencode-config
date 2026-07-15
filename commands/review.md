---
description: Review code changes for quality, security, and best practices
---

Review the current code changes or the specified files. Focus on:

1. **Correctness** — logic errors, edge cases, off-by-one bugs
2. **Security** — injection, path traversal, secret leaks, unsafe eval
3. **Performance** — unnecessary allocations, N+1 queries, blocking in async
4. **Readability** — naming, structure, unnecessary complexity
5. **Tests** — missing coverage, brittle assertions, test isolation

Output format:
- **Critical** (must fix): security vulnerabilities, data loss risks, broken logic
- **Warning** (should fix): performance issues, missing error handling, code smells
- **Info** (nice to have): style, naming, minor refactorings

If reviewing a git diff, use `git diff` and `git diff --staged` to see changes.
If no files specified, review the most recent uncommitted changes.
