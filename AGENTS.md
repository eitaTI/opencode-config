# AGENTS — EitaTI OpenCode Global Config

You are working in the **EitaTI OpenCode global config** repository: a
versioned, one-command installer that drops a curated OpenCode
configuration (LSP, MCP, plugins, skills, commands) into a user's global
OpenCode config directory.

## What this repo is

- `opencode.jsonc` — the main config (LSP, MCP, plugins, permissions, `instructions`).
- `bin/install.mjs` — the cross-platform installer (Node.js).
- `install.sh` — the Unix installer (idempotent).
- `skills/` — 7 global skills copied into the user's config dir.
- `commands/` — 6 custom slash commands.
- `docs/` — `lsp.md`, `mcp.md`, `plugins.md` (human-facing docs).

## What gets installed

The installer copies to `~/.config/opencode/`:

- `opencode.jsonc` — main config (overwrites)
- `skills/` — 7 global skills
- `commands/` — 6 custom commands
- `docs/` — human-facing docs
- `AGENTS.md` — agent instructions

## Conventions

- **Commits:** Conventional Commits — see `skills/conventional-commits`.
- **Releases:** a "release" means a **GitHub Release**, not just a git tag.
  Cut one with `skills/git-release`. Tag + `gh release create`.

## Skills available in this repo

| Skill | Description |
|-------|-------------|
| `clonedeps` | Clone dependency source code for inspection |
| `codemap` | Generate hierarchical code maps for unfamiliar repositories |
| `conventional-commits` | Write Conventional Commits and well-scoped commit messages |
| `explain-code` | Explain code files, modules, or functions clearly |
| `git-release` | Create consistent releases and changelogs from merged PRs |
| `simplify` | Simplify code for clarity without changing behavior |
| `worktrees` | Manage Git worktrees as safe isolated coding lanes |

## Custom commands available

| Command | Description |
|---------|-------------|
| `/review` | Review code changes for quality, security, and best practices |
| `/test` | Run tests and report results |
| `/fix` | Fix failing tests, lint errors, or type errors |
| `/explain` | Explain how code works in plain language |
| `/clean` | Clean up code for readability without changing behavior |
| `/commit` | Create a conventional commit from current changes |

## Skill Auto-Invoction Rules (MANDATORY)

**The agent MUST automatically invoke the appropriate skill BEFORE responding to user request.** Do NOT wait for the user to ask for a skill.

### When the user asks to EXPLAIN code:
1. **Use `explain-code`** — analyze the file/module/function

### When the user asks to SIMPLIFY code:
1. **Use `simplify`** — reduce complexity without changing behavior

### When the user asks to CREATE A RELEASE:
1. **Use `git-release`** — tag + GitHub Release
2. **Use `conventional-commits`** for commit messages

### When the user asks to MAP or DOCUMENT a codebase:
1. **Use `codemap`** — generate hierarchical code map

### When the user wants to CLONE dependencies for inspection:
1. **Use `clonedeps`** — clone and analyze dependency source code

### When the user wants to MANAGE Git worktrees:
1. **Use `worktrees`** — create and manage isolated coding lanes

### CRITICAL RULE:
**NEVER respond to a task without first checking if a skill applies.** If a skill matches, announce "Using [skill] to [purpose]" and follow it exactly. The only exception is pure conversational questions (greetings, opinions, explanations of concepts).
