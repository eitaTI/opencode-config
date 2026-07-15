---
description: Create a conventional commit from current changes
---

Create a git commit following Conventional Commits convention.

1. Run `git diff` and `git diff --staged` to see all changes.

2. Analyze the changes:
   - What type? (feat, fix, refactor, docs, test, chore, perf, ci, build)
   - What scope? (component, module, or package affected)
   - What's the summary? (imperative mood, lowercase, no period)

3. Stage the relevant files (ask user which files if ambiguous).

4. Create the commit with format:
   ```
   <type>(<scope>): <summary>

   <optional body explaining what and why, not how>
   ```

5. Show the commit with `git log -1 --stat`.
