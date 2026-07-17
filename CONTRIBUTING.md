# Contributing to EitaTI OpenCode Global Config

Thanks for contributing. This repo is a versioned, one-command installer
that ships a curated OpenCode configuration (LSP, MCP, plugins, skills)
to a user's global OpenCode config dir.

## Repository layout

- `opencode.jsonc` — main config (LSP, MCP, plugins, `instructions`).
- `bin/install.mjs` — cross-platform installer (runs under Node).
- `plugins/rtk.ts` — local OpenCode plugin (vendored from rtk, `hooks/opencode/rtk.ts`).
  It auto-rewrites bash commands via `rtk rewrite` (token savings). Loaded by
  OpenCode from `~/.config/opencode/plugins/`; do NOT add it to the `plugin`
  array (that would try `npm i rtk`). Keep it in sync with upstream; the only
  local change is `which`/`where` for Windows PATH detection.
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
- It **auto-installs** missing prerequisites (Node.js, uv, ruff, rtk) unless
  `--no-auto-install` is specified.
- Use `--force` to skip the overwrite confirmation prompt.
- Use `--clean` to remove all config files without reinstalling.
- Pass command arguments with **`spawnSync`**. `execSync(full, { args })`
  silently drops `args` and breaks `setx` / `npx` calls.

## Windows strategy (pwsh always)

Windows users always run OpenCode under `pwsh` (PowerShell 7) as the default
shell — we do **not** set `"shell": "bash"`. To keep the existing Unix
permission patterns and the `rtk` plugin relevant, the installer:

1. Auto-installs **Git for Windows** via `winget` (direct download fallback
   that resolves the latest release from the GitHub API at runtime).
2. Appends `C:\Program Files\Git\usr\bin` (GNU `grep`/`head`/`tail`/`sed`/
   `awk`/`ls`/`cat`) to the **end** of the user `PATH`, so those commands work
   inside `pwsh` without overriding Windows built-ins like `find.exe`.
3. Sets `OPENCODE_GIT_BASH_PATH` (workaround for OpenCode issue #10871) in case
   the user later switches to bash.

Permission patterns in `opencode.jsonc` include PowerShell fallbacks
(`type`, `dir`, `Get-Content`, `Get-ChildItem`, `Select-String`) for when the
GNU tools are not yet on PATH.

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
