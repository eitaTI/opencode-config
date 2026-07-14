#!/usr/bin/env bash
set -euo pipefail

# EitaTI — OpenCode global config installer
# Symlinks this repo into ~/.config/opencode so OpenCode loads it globally.
# Safe to re-run (idempotent).

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

# --- Node.js (single runner for MCP servers + plugins) ---
if ! command -v node >/dev/null 2>&1; then
	echo "==> Installing Node.js LTS..."
	curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
	sudo apt-get install -y nodejs
else
	echo "==> Node.js already present: $(node --version)"
fi

# --- ruff (Python LSP + formatter) ---
# Standalone Rust binary. Astral does NOT publish ruff to npm, so it can't run
# via `npx`; this is a direct binary, not a package runner. Installed standalone
# so the only required ecosystem is Node.js (no uv/pip needed).
if ! command -v ruff >/dev/null 2>&1; then
	echo "==> Installing ruff (standalone binary)..."
	curl -LsSf https://astral.sh/ruff/install.sh | sh
else
	echo "==> ruff already present: $(ruff --version)"
fi

mkdir -p "$DEST"

ln -sfn "$SRC/opencode.jsonc" "$DEST/opencode.jsonc"
ln -sfn "$SRC/skills" "$DEST/skills"
ln -sfn "$SRC/docs" "$DEST/docs"
ln -sfn "$SRC/AGENTS.md" "$DEST/AGENTS.md"
ln -sfn "$SRC/CONTRIBUTING.md" "$DEST/CONTRIBUTING.md"

# --- Multi-agent orchestrator (Superpowers) ---
# Superpowers is installed via git-backed plugin install in opencode.jsonc.
# No additional installation step needed - OpenCode handles it automatically.
echo "==> Superpowers orchestrator will be installed by OpenCode via plugin system"

echo
echo "Linked OpenCode config -> $DEST"
echo "Verify with:  opencode mcp list   &&   opencode debug config"
