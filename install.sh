#!/usr/bin/env bash
set -euo pipefail

# EitaTI — OpenCode global config installer
# Symlinks this repo into ~/.config/opencode so OpenCode loads it globally.
# Safe to re-run (idempotent).

# --- Windows detection ---
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
	echo "==> Windows detected. Use the cross-platform installer instead:"
	echo "    node bin/install.mjs"
	echo "    or: npx -y github:EitaTI/opencode-config"
	exit 1
fi

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

# --- Detect distro / package manager ---
detect_distro() {
	if command -v pacman >/dev/null 2>&1; then
		echo "arch"
	elif command -v apt-get >/dev/null 2>&1; then
		echo "debian"
	elif command -v dnf >/dev/null 2>&1; then
		echo "fedora"
	elif command -v zypper >/dev/null 2>&1; then
		echo "suse"
	else
		echo "unknown"
	fi
}

DISTRO=$(detect_distro)

# --- Node.js (single runner for MCP servers + plugins) ---
if ! command -v node >/dev/null 2>&1; then
	echo "==> Installing Node.js LTS..."
	case "$DISTRO" in
	arch)
		sudo pacman -S --noconfirm nodejs npm
		;;
	debian)
		curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
		sudo apt-get install -y nodejs
		;;
	fedora)
		sudo dnf install -y nodejs npm
		;;
	suse)
		sudo zypper install -y nodejs npm
		;;
	*)
		echo "    Unsupported distro. Install Node.js manually:"
		echo "    https://nodejs.org/en/download"
		exit 1
		;;
	esac
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

# --- uv (Python package manager for MCP fetch server) ---
# Used by `uvx mcp-server-fetch` (official Python MCP server).
if ! command -v uv >/dev/null 2>&1; then
	echo "==> Installing uv..."
	curl -LsSf https://astral.sh/uv/install.sh | sh
else
	echo "==> uv already present: $(uv --version)"
fi

# --- rtk (Rust Token Killer) ---
# Reduces LLM token consumption by 60-90% by filtering shell command output.
# Single Rust binary, zero dependencies.
if ! command -v rtk >/dev/null 2>&1; then
	echo "==> Installing rtk (Rust Token Killer)..."
	curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
else
	echo "==> rtk already present: $(rtk --version)"
fi

mkdir -p "$DEST"

ln -sfn "$SRC/opencode.jsonc" "$DEST/opencode.jsonc"
ln -sfn "$SRC/skills" "$DEST/skills"
ln -sfn "$SRC/commands" "$DEST/commands"
ln -sfn "$SRC/docs" "$DEST/docs"
ln -sfn "$SRC/AGENTS.md" "$DEST/AGENTS.md"

echo
echo "Linked OpenCode config -> $DEST"
echo "Verify with:  opencode mcp list   &&   opencode debug config"
