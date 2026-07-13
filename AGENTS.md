# AGENTS — EitaTI OpenCode Global Config

You are working in the **EitaTI OpenCode global config** repository: a
versioned, one-command installer that drops a curated OpenCode
configuration (LSP, MCP, plugins, skills) into a user's global
OpenCode config directory.

## What this repo is

- `opencode.jsonc` — the main config (LSP, MCP, plugins, `instructions`).
- `bin/install.mjs` — the cross-platform installer. Runs under **Node**
  (`#!/usr/bin/env node`); launched via `bunx github:EitaTI/opencode-config`
  (or `npx`, which needs Node.js/npm on PATH).
- `skills/` — global skills copied into the user's config dir.
- `docs/` — `lsp.md`, `mcp.md`, `plugins.md` (human-facing docs).
- `README.md` — user-facing quick start.

## Installer contract (read before touching `bin/install.mjs`)

- Runs under **Node**, not Bun. `npx`/`bunx` launch it.
- It does **not** auto-install tooling. It checks for **Bun, uv, ruff**
  and, if any are missing, prints the per-OS install command and exits
  (the user installs them, then re-runs the command).
- It then copies `opencode.jsonc`, `skills/`, `docs/` into the target
  dir, materializes `oh-my-opencode-slim`, and sets the
  `OPENCODE_EXPERIMENTAL_LSP_TOOL` user env var (Windows: `setx`;
  Unix: appends to the shell rc file).
- Command arguments are passed with **`spawnSync`** — never `execSync`
  with an `args` option, which silently drops every argument.

## MCP servers (defined in `opencode.jsonc`)

- `fetch` → `uvx mcp-server-fetch` (official Python server). The npm
  name `@modelcontextprotocol/server-fetch` does **not** exist, and the
  unscoped `mcp-server-fetch` is a **malicious canary** — never use it.
- `sequentialthinking` → `bunx @modelcontextprotocol/server-sequential-thinking`
  (note the **hyphen**; the no-hyphen name 404s).
- `context7`, `gh_grep` are remote. `git` → `@cyanheads/git-mcp-server`,
  `sqlite` → `@mokei/mcp-sqlite`.

## Conventions

- **Commits:** Conventional Commits — see `skills/conventional-commits`.
- **Releases:** a "release" means a **GitHub Release**, not just a git tag.
  Cut one with `skills/git-release`. Tag + `gh release create`.
- **bunx cache:** after pushing a change to `bin/install.mjs` or
  `opencode.jsonc`, the user must **bust the bunx cache** before re-testing,
  or bunx serves a 24h-stale copy (oven-sh/bun#27379):
  `bun pm cache rm` + remove `$env:TEMP\bunx-*` (Windows), then re-run.

## Skills available in this repo

- `git-release` — cut a release (tag + GitHub Release).
- `conventional-commits` — commit message format.
- `simplify` / `explain-code` — code quality and understanding.
- `oh-my-opencode-slim` — the multi-agent orchestrator this config ships.
- `codemap`, `clonedeps`, `deepwork`, `reflect`, `worktrees`,
  `release-smoke-test`, `agent-orchestration` — see each `SKILL.md`.
