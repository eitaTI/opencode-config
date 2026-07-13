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

# --- Multi-agent orchestrator (oh-my-openagent) ---
# Idempotent: materializes its agents/commands into the OpenCode config dir.
echo "==> Setting up oh-my-openagent (multi-agent orchestrator)..."
npx -y oh-my-openagent@latest install ||
	echo "   (warn) oh-my-openagent install step failed; run manually: npx -y oh-my-openagent@latest install"

# --- Experimental LSP tool (OPENCODE_EXPERIMENTAL_LSP_TOOL) ---
# OpenCode reads this env var at startup to enable experimental LSP-based
# tools. Export it into the shell rc so it persists for OpenCode launches.
# Guarded so re-running install.sh never duplicates the line.
EXP_LINE='export OPENCODE_EXPERIMENTAL_LSP_TOOL=true'
for rc in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
	if [ -f "$rc" ] && ! grep -qF "OPENCODE_EXPERIMENTAL_LSP_TOOL" "$rc"; then
		echo "" >>"$rc"
		echo "# >>> opencode-config >>>" >>"$rc"
		echo "$EXP_LINE" >>"$rc"
		echo "# <<< opencode-config <<<" >>"$rc"
		echo "==> Added $EXP_LINE to $rc"
	fi
done

echo
echo "Linked OpenCode config -> $DEST"
echo "Verify with:  opencode mcp list   &&   opencode debug config"
