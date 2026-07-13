#!/usr/bin/env bash
set -euo pipefail

# EitaTI — OpenCode global config installer
# Symlinks this repo into ~/.config/opencode so OpenCode loads it globally.
# Safe to re-run (idempotent).

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

mkdir -p "$DEST"

ln -sfn "$SRC/opencode.jsonc" "$DEST/opencode.jsonc"
ln -sfn "$SRC/skills"          "$DEST/skills"

echo "Linked OpenCode config -> $DEST"
echo "Verify with:  opencode mcp list   &&   opencode debug config"
