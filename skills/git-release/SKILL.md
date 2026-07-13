---
name: git-release
description: Create consistent releases and changelogs from merged PRs and git history
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---
## What I do
- Draft release notes from merged PRs and conventional commits
- Propose a semver version bump based on commit types
- Provide a copy-pasteable `gh release create` command

## When to use me
Use this when preparing a tagged release. Ask clarifying questions if the
target versioning scheme (semver, calendar, etc.) is unclear.
