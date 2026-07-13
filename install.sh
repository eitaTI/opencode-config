#!/usr/bin/env bash
set -euo pipefail

# EitaTI — OpenCode global config installer
# Symlinks this repo into ~/.config/opencode so OpenCode loads it globally.
# Safe to re-run (idempotent).

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

# --- Bun (single runner for MCP servers + plugins) ---
if ! command -v bun >/dev/null 2>&1; then
  echo "==> Installing Bun (https://bun.sh)..."
  curl -fsSL https://bun.sh/install | bash
  # Make bun available in this shell for the steps below.
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"
else
  echo "==> Bun already present: $(bun --version)"
fi

mkdir -p "$DEST"

ln -sfn "$SRC/opencode.jsonc" "$DEST/opencode.jsonc"
ln -sfn "$SRC/skills"          "$DEST/skills"

# --- Multi-agent orchestrator (oh-my-opencode-slim) ---
# Idempotent: materializes its agents/commands into the OpenCode config dir.
echo "==> Setting up oh-my-opencode-slim (multi-agent orchestrator)..."
bunx oh-my-opencode-slim@latest install || \
  echo "   (warn) oh-my-opencode-slim install step failed; run manually: bunx oh-my-opencode-slim@latest install"

echo
echo "Linked OpenCode config -> $DEST"
echo "Verify with:  opencode mcp list   &&   opencode debug config"
