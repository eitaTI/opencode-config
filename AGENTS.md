# AGENTS — EitaTI OpenCode Global Config

You are working in the **EitaTI OpenCode global config** repository: a
versioned, one-command installer that drops a curated OpenCode
configuration (LSP, MCP, plugins, skills) into a user's global
OpenCode config directory.

## What this repo is

- `opencode.jsonc` — the main config (LSP, MCP, plugins, `instructions`).
- `bin/install.mjs` — the cross-platform installer. Runs under **Node**
  (`#!/usr/bin/env node`); launched via `npx github:EitaTI/opencode-config`.
- `install.sh` — the Unix installer (idempotent).
- `skills/` — global skills copied into the user's config dir.
- `docs/` — `lsp.md`, `mcp.md`, `plugins.md` (human-facing docs).
- `README.md` — user-facing quick start.

## What gets installed

The installer copies to `~/.config/opencode/` (or `%APPDATA%/opencode` on Windows):

| Source | Destination | Notes |
|--------|-------------|-------|
| `opencode.jsonc` | `~/.config/opencode/opencode.jsonc` | Main config (overwrites) |
| `skills/` | `~/.config/opencode/skills/` | 13 global skills |
| `docs/` | `~/.config/opencode/docs/` | Human-facing docs |
| `AGENTS.md` | `~/.config/opencode/AGENTS.md` | Agent instructions |
| `CONTRIBUTING.md` | `~/.config/opencode/CONTRIBUTING.md` | Contributor guide |

The installer also:
- Installs **Superpowers** plugin via git-backed plugin system

## Environment requirements

Before running the installer, ensure these are installed:

| Tool | Purpose | Install |
|------|---------|---------|
| **Node.js** | Installer runtime | [nodejs.org](https://nodejs.org) |
| **uv** | Python package manager | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **ruff** | Python linter | `pip install ruff` or via `uv` |

The installer checks for these and exits with install commands if any are missing.

## Installer contract (read before touching `bin/install.mjs`)

- Runs under **Node**, not Bun. `npx` launch it.
- It does **not** auto-install tooling. It checks for **Node.js, uv, ruff**
  and, if any are missing, prints the per-OS install command and exits
  (the user installs them, then re-runs the command).
- It then copies `opencode.jsonc`, `skills/`, `docs/`, `AGENTS.md`, `CONTRIBUTING.md` into the target
  dir and installs `Superpowers` via git-backed plugin.
- Command arguments are passed with **`spawnSync`** — never `execSync`
  with an `args` option, which silently drops every argument.

## MCP servers (defined in `opencode.jsonc`)

| Server | Command | Notes |
|--------|---------|-------|
| `fetch` | `uvx mcp-server-fetch` | Official Python server. |
| `sequentialthinking` | `npx -y @modelcontextprotocol/server-sequential-thinking` | Note the **hyphen**; the no-hyphen name 404s. |
| `context7` | Remote | Library documentation |
| `gh_grep` | Remote | GitHub code search |
| `git` | `@cyanheads/git-mcp-server` | Git operations |
| `sqlite` | `@mokei/mcp-sqlite` | SQLite database |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | File system access |
| `memory` | `@modelcontextprotocol/server-memory` | Persistent memory |

## LSP servers (defined in `opencode.jsonc`)

14 language servers configured:

| Server | Language/Feature |
|--------|------------------|
| `basedpyright` | Python (type checking) |
| `ruff` | Python (linting/formatting) |
| `vtsls` | TypeScript/JavaScript |
| `eslint-lsp` | JavaScript/TypeScript (linting) |
| `tailwindcss` | Tailwind CSS |
| `emmet` | HTML/CSS expansion |
| `bash-language-server` | Bash/Shell |
| `docker-langserver` | Dockerfile |
| `yaml-language-server` | YAML |
| `vscode-json-language-server` | JSON |
| `vscode-html-language-server` | HTML |
| `vscode-css-language-server` | CSS |
| `vscode-markdown-language-server` | Markdown |
| `ansible-language-server` | Ansible |

## Plugins (defined in `opencode.jsonc`)

| Plugin | Description |
|--------|-------------|
| `Superpowers` | Multi-agent orchestrator with specialized skills |
| `opencode-mem` | Persistent memory across sessions |
| `@tarquinen/opencode-dcp` | Data comparison tool |
| `opencode-websearch-cited` | Web search with citations |
| `opencode-wakatime` | Coding activity tracking |
| `opencode-pty` | Pseudo-terminal support |
| `envsitter-guard` | Environment file protection |
| `opencode-smart-title` | Session title management |

## Conventions

- **Commits:** Conventional Commits — see `skills/conventional-commits`.
- **Releases:** a "release" means a **GitHub Release**, not just a git tag.
  Cut one with `skills/git-release`. Tag + `gh release create`.

## Skills available in this repo

13 global skills installed to `~/.config/opencode/skills/`:

| Skill | Description |
|-------|-------------|
| `agent-orchestration` | Decide when to delegate to Superpowers orchestrator vs working directly |
| `clonedeps` | Clone dependency source code for inspection |
| `codemap` | Generate hierarchical code maps for unfamiliar repositories |
| `conventional-commits` | Write Conventional Commits and well-scoped commit messages |
| `deepwork` | High-cost orchestrator workflow for large, multi-phase coding efforts |
| `explain-code` | Explain code files, modules, or functions clearly |
| `git-release` | Create consistent releases and changelogs from merged PRs |
| `oh-my-openagent` | Configure and improve Superpowers setup |
| `reflect` | Review recent work, find patterns, suggest improvements |
| `release-smoke-test` | Test Superpowers release candidates or bugfixes |
| `simplify` | Simplify code for clarity without changing behavior |
| `worktrees` | Manage Git worktrees as safe isolated coding lanes |

See each `SKILL.md` for detailed usage instructions.

## Skill Auto-Invoction Rules (MANDATORY)

**The agent MUST automatically invoke the appropriate skill BEFORE responding to user request.** Do NOT wait for the user to ask for a skill. The following triggers are mandatory:

### When the user wants to BUILD or CREATE something:
1. **Use `brainstorming`** first — refine the idea, explore alternatives, present design
2. After design approval → **use `writing-plans`** to create implementation plan
3. After plan approval → **use `subagent-driven-development`** or **`executing-plans`** to implement

### When the user reports a BUG or ERROR:
1. **Use `systematic-debugging`** — follow the 4-phase root cause process
2. After fix → **use `verification-before-completion`** to confirm the fix

### When the user asks to IMPLEMENT a feature (clear spec provided):
1. **Use `writing-plans`** to break into tasks
2. After plan approval → **use `subagent-driven-development`** to execute

### When the user asks to REVIEW code:
1. **Use `requesting-code-review`** — follow the pre-review checklist
2. If receiving feedback → **use `receiving-code-review`**

### When the user asks to EXPLAIN code:
1. **Use `explain-code`** — analyze the file/module/function

### When the user asks to SIMPLIFY code:
1. **Use `simplify`** — reduce complexity without changing behavior

### When starting work on a new FEATURE BRANCH:
1. **Use `using-git-worktrees`** — create isolated workspace
2. Implement → test → **use `finishing-a-development-branch`** to merge/PR

### When the user asks to CREATE A RELEASE:
1. **Use `git-release`** — tag + GitHub Release
2. **Use `conventional-commits`** for commit messages

### When the user asks to MAP or DOCUMENT a codebase:
1. **Use `codemap`** — generate hierarchical code map

### When the user wants DEEP, FOCUSED work:
1. **Use `deepwork`** — orchestrate multi-phase coding effort

### When the user wants to REFLECT or ANALISE on past work:
1. **Use `reflect`** — review patterns, suggest improvements

### CRITICAL RULE:
**NEVER respond to a task without first checking if a skill applies.** If a skill matches, announce "Using [skill] to [purpose]" and follow it exactly. The only exception is pure conversational questions (greetings, opinions, explanations of concepts).

## Troubleshooting

### Installer fails with "Missing required tools"
Run the installer again — it will print the exact install command for your OS.

### LSP servers not working
- Restart your terminal after installation
- Run `opencode debug config` to verify LSP configuration

### MCP servers not connecting
- Check that `uv` is installed and in your PATH
- Run `opencode mcp list` to see server status
- Some servers require initial package download (first run may be slow)

### Skills not appearing
- Verify `~/.config/opencode/skills/` exists and contains skill directories
- Each skill must have a `SKILL.md` file
- Restart OpenCode after installation

## Quick start

```bash
# Install the config
npx github:EitaTI/opencode-config

# Verify installation
opencode debug config

# List MCP servers
opencode mcp list
```
