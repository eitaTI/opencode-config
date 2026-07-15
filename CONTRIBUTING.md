# Contributing to EitaTI OpenCode Global Config

Thanks for contributing. This repo is a versioned, one-command installer
that ships a curated OpenCode configuration (LSP, MCP, plugins, skills)
to a user's global OpenCode config dir.

## Repository layout

- `opencode.jsonc` — main config (LSP, MCP, plugins, `instructions`).
- `bin/install.mjs` — cross-platform installer (runs under Node).
- `skills/` — global skills copied into the user's config.
- `commands/` — custom slash commands.
- `docs/` — `lsp.md`, `mcp.md`, `plugins.md`.
- `README.md` — user-facing quick start.

## Workflow

1. Fork / branch off `master`.
2. Make your change. Keep commits focused.
3. Follow **Conventional Commits** — use the `conventional-commits` skill.
4. Open a PR describing the user-facing impact.

## Changing the installer (`bin/install.mjs`)

- It runs under **Node** (`#!/usr/bin/env node`), not Bun.
- It **checks** for Node.js/uv/ruff (required) and rtk (optional), and prints
  install commands if any are missing — it does **not** auto-install them.
- Use `--force` to skip the overwrite confirmation prompt.
- Use `--clean` to remove all config files without reinstalling.
- Pass command arguments with **`spawnSync`**. `execSync(full, { args })`
  silently drops `args` and breaks `setx` / `npx` calls.

## Changing MCP servers (`opencode.jsonc`)

- `fetch` uses `uvx mcp-server-fetch` (official Python server). The npm
  name `@modelcontextprotocol/server-fetch` does **not** exist, and the
  unscoped `mcp-server-fetch` is a **malicious canary** — never use it.
- `sequentialthinking` is `npx -y @modelcontextprotocol/server-sequential-thinking`
  (note the **hyphen**; the no-hyphen name 404s).

## Adding or editing a skill

- Each skill lives in its own dir under `skills/<name>/` with a
  `SKILL.md` (YAML frontmatter: `name` + `description`; the
  `description` should say **when** to use it, then a markdown body
  with concrete workflow steps).
- Skills are copied verbatim into the user's global config, so keep them
  self-contained and free of repo-internal paths.

## Releasing

Use the `git-release` skill: it creates an annotated tag **and** a
GitHub Release (a "release" here means the GitHub Release object, not
just a git tag). Bump the version per SemVer:
patch for fixes, minor for behavior changes, major for breaking.
