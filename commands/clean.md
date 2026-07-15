---
description: Clean up code for readability without changing behavior
---

Simplify the specified code or files in the current directory.

Apply these principles:
1. **Remove dead code** — unused imports, variables, functions
2. **Reduce nesting** — early returns, guard clauses, extract functions
3. **Simplify conditionals** — boolean expressions, ternary operators
4. **Improve naming** — clear, descriptive variable/function names
5. **Remove duplication** — extract common patterns

Do NOT:
- Change external behavior
- Remove error handling
- Change public APIs
- Optimize for performance (use /optimize for that)

After simplifying, run tests to verify nothing broke.
