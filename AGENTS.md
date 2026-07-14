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

## Installer contract (read before touching `bin/install.mjs`)

- Runs under **Node**, not Bun. `npx` launch it.
- It does **not** auto-install tooling. It checks for **Node.js, uv, ruff**
  and, if any are missing, prints the per-OS install command and exits
  (the user installs them, then re-runs the command).
- It then copies `opencode.jsonc`, `skills/`, `docs/` into the target
  dir, installs `Superpowers` via git-backed plugin, and sets the
  `OPENCODE_EXPERIMENTAL_LSP_TOOL` user env var (Windows: `setx`;
  Unix: appends to the shell rc file).
- Command arguments are passed with **`spawnSync`** — never `execSync`
  with an `args` option, which silently drops every argument.

## MCP servers (defined in `opencode.jsonc`)

- `fetch` → `uvx mcp-server-fetch` (official Python server). The npm
  name `@modelcontextprotocol/server-fetch` does **not** exist, and the
  unscoped `mcp-server-fetch` is a **malicious canary** — never use it.
- `sequentialthinking` → `npx -y @modelcontextprotocol/server-sequential-thinking`
  (note the **hyphen**; the no-hyphen name 404s).
- `context7`, `gh_grep` are remote. `git` → `@cyanheads/git-mcp-server`,
  `sqlite` → `@mokei/mcp-sqlite`, `filesystem` → `@modelcontextprotocol/server-filesystem`,
  `memory` → `@modelcontextprotocol/server-memory`.

## LSP servers (defined in `opencode.jsonc`)

19 language servers configured: `basedpyright`, `ruff`, `vtsls`, `eslint-lsp`,
`tailwindcss`, `emmet`, `bash-language-server`, `docker-langserver`,
`yaml-language-server`, `vscode-json-language-server`, `vscode-html-language-server`,
`vscode-css-language-server`, `vscode-markdown-language-server`, `ansible-language-server`.

## Plugins (defined in `opencode.jsonc`)

10 plugins: `Superpowers`, `opencode-mem`, `opencode-notify`,
`@tarquinen/opencode-dcp`, `opencode-websearch-cited`,
`opencode-wakatime`, `opencode-pty`, `opencode-snip`,
`envsitter-guard`, `opencode-smart-title`.

## Conventions

- **Commits:** Conventional Commits — see `skills/conventional-commits`.
- **Releases:** a "release" means a **GitHub Release**, not just a git tag.
  Cut one with `skills/git-release`. Tag + `gh release create`.

## Skills available in this repo

- `git-release` — cut a release (tag + GitHub Release).
- `conventional-commits` — commit message format.
- `simplify` / `explain-code` — code quality and understanding.
- `superpowers` — the multi-agent orchestrator this config ships.
- `codemap`, `clonedeps`, `deepwork`, `reflect`, `worktrees`,
  `release-smoke-test`, `agent-orchestration` — see each `SKILL.md`.
