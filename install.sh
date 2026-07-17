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

# --- curl check (needed for ruff, uv, rtk installation) ---
if ! command -v curl >/dev/null 2>&1; then
	echo "==> ERROR: curl is required but not installed."
	case "$(detect_distro)" in
	arch)    echo "    Install with: sudo pacman -S curl" ;;
	debian)  echo "    Install with: sudo apt-get install -y curl" ;;
	fedora)  echo "    Install with: sudo dnf install -y curl" ;;
	suse)    echo "    Install with: sudo zypper install -y curl" ;;
	*)       echo "    Install curl manually and re-run this script." ;;
	esac
	exit 1
fi

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

VERSION="$(grep -m1 '"version"' "$SRC/package.json" | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"
echo "==> EitaTI OpenCode config installer v$VERSION"

DISTRO=$(detect_distro)

# --- Node.js (single runner for MCP servers + plugins) ---
# On Arch/CachyOS, prefer FNM (Fast Node Manager) over pacman to avoid
# conflicts with system packages and allow per-project version switching.
# On other distros, use the system package manager.
if ! command -v node >/dev/null 2>&1; then
	echo "==> Installing Node.js LTS..."
	case "$DISTRO" in
	arch)
		# Prefer FNM over pacman — avoids /usr conflicts, allows version switching.
		if command -v fnm >/dev/null 2>&1; then
			echo "    FNM found, installing Node.js LTS via FNM..."
			fnm install --lts
			fnm use lts-latest
		elif command -v nvm >/dev/null 2>&1; then
			echo "    NVM found, installing Node.js LTS via NVM..."
			nvm install --lts
			nvm use --lts
		else
			# Fallback: install FNM (Rust binary, zero dependencies)
			echo "    Installing FNM (Fast Node Manager)..."
			curl -fsSL https://fnm.vercel.app/install | bash
			export PATH="$HOME/.local/share/fnm:$PATH"
			eval "$(fnm env)"
			fnm install --lts
			fnm use lts-latest
		fi
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

# --- AUR helper (yay|paru) detection ---
# Used as a fallback when pacman fails (e.g. a broken mirror). `paru` accepts
# `--skipreview`; `yay` requires `--noansweredit`.
AUR_HELPER=""
if command -v paru >/dev/null 2>&1; then AUR_HELPER="paru";
elif command -v yay >/dev/null 2>&1; then AUR_HELPER="yay"; fi
AUR_EDIT_FLAG="--skipreview"
[ "$AUR_HELPER" = "yay" ] && AUR_EDIT_FLAG="--noansweredit"

# --- ruff (Python LSP + formatter) ---
# Python linter + formatter written in Rust. On Arch/CachyOS the package is
# named `python-ruff` (it provides the `ruff` binary). Installed via pacman,
# with a fallback to the AUR helper (yay|paru) if pacman fails (e.g. a broken
# mirror). Installs stay exclusive to pacman/AUR — never the standalone
# installer or npm. On non-Arch distros, the standalone binary from Astral is
# used.
if ! command -v ruff >/dev/null 2>&1; then
	echo "==> Installing ruff..."
	case "$DISTRO" in
	arch)
		if pacman -Qi python-ruff >/dev/null 2>&1; then
			echo "    ruff already installed via pacman (python-ruff)"
		else
			echo "    Refreshing pacman databases (sudo pacman -Sy)..."
			sudo pacman -Sy || echo "    (warn) pacman -Sy failed; continuing..."
			if sudo pacman -S --noconfirm python-ruff; then
				echo "    ruff installed via pacman (python-ruff)"
			elif [ -n "$AUR_HELPER" ]; then
				echo "    pacman failed, trying AUR helper ($AUR_HELPER)..."
				"$AUR_HELPER" -S --noconfirm "$AUR_EDIT_FLAG" python-ruff
			else
				echo "    (warn) Could not install ruff via pacman or AUR — install manually:" >&2
				echo "    sudo pacman -S python-ruff   (or install an AUR helper: yay/paru)" >&2
				echo "    If the failure is a 404 on a *.pkg.tar.zst.sig, your mirror is broken:" >&2
				echo "    sudo pacman -Syy && sudo pacman-key --refresh-keys" >&2
			fi
		fi
		;;
	*)
		echo "    Installing ruff (standalone binary)..."
		curl -LsSf https://astral.sh/ruff/install.sh | sh
		;;
	esac
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
	case "$DISTRO" in
	arch)
		if pacman -Qi rtk >/dev/null 2>&1; then
			echo "    rtk already installed via AUR"
		elif [ -n "$AUR_HELPER" ]; then
			"$AUR_HELPER" -S --noconfirm "$AUR_EDIT_FLAG" rtk
		else
			echo "    (warn) rtk is AUR-only and no AUR helper (yay/paru) found." >&2
			echo "    Install one, then run: yay -S rtk   or   paru -S rtk" >&2
		fi
		;;
	*)
		curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
		;;
	esac
else
	echo "==> rtk already present: $(rtk --version)"
fi

# --- LSPs invoked *directly* by opencode.jsonc ---
# (bash-language-server, yaml-language-server)
# LSPs run via `npx -y` (vtsls, docker, vscode-*, basedpyright,
# tailwindcss, emmet, eslint-lsp) need no install.
# On Arch/CachyOS prefer pacman/AUR (yay|paru) over `npm i -g`,
# which writes outside pacman's control and can break system updates.
# (AUR_HELPER / AUR_EDIT_FLAG are detected earlier, before the ruff step.)

# install_lsp <binary> <pacman-pkg> <aur-pkg> <npm-pkg>
# On Arch/CachyOS, installs stay exclusive to pacman/AUR (yay|paru) — never npm.
# On other distros, the npm package is used.
install_lsp() {
  local bin="$1" pac="$2" aur="$3" npm="$4"
  if command -v "$bin" >/dev/null 2>&1; then
    echo "==> $bin already present"
    return
  fi
  echo "==> Installing $bin..."
  if [ "$DISTRO" = "arch" ]; then
    if [ -n "$pac" ]; then
      sudo pacman -S --noconfirm "$pac"
    elif [ -n "$AUR_HELPER" ] && [ -n "$aur" ]; then
      "$AUR_HELPER" -S --noconfirm "$AUR_EDIT_FLAG" "$aur"
    else
      echo "    (warn) $bin has no pacman package and no AUR helper (yay/paru) on this system." >&2
      if [ -n "$aur" ]; then
        echo "    Install an AUR helper then run: $AUR_HELPER -S $AUR_EDIT_FLAG $aur" >&2
      else
        echo "    No Arch package available for $bin — install manually." >&2
      fi
    fi
  else
    npm i -g "$npm"
  fi
}

#            binary                     pacman                    AUR                          npm
install_lsp bash-language-server       bash-language-server      ""                           bash-language-server
install_lsp yaml-language-server       yaml-language-server      ""                           yaml-language-server

# Se o Node foi instalado via FNM/nvm nesta mesma execução, o `npm`
# pode não estar no PATH do shell atual — disponibiliza antes do `npm i -g`.
if ! command -v npm >/dev/null 2>&1; then
	export PATH="$HOME/.local/share/fnm:$PATH" 2>/dev/null
	# shellcheck disable=SC2091
	eval "$(fnm env 2>/dev/null)" 2>/dev/null
	export PATH="$HOME/.nvm/versions/node/*/bin:$PATH" 2>/dev/null
fi

mkdir -p "$DEST"

ln -sfn "$SRC/opencode.jsonc" "$DEST/opencode.jsonc"
ln -sfn "$SRC/plugins" "$DEST/plugins"
ln -sfn "$SRC/skills" "$DEST/skills"
ln -sfn "$SRC/commands" "$DEST/commands"
ln -sfn "$SRC/docs" "$DEST/docs"
ln -sfn "$SRC/AGENTS.md" "$DEST/AGENTS.md"

echo
echo "Linked OpenCode config -> $DEST"
echo "Verify with:  opencode mcp list   &&   opencode debug config"
echo
echo "IMPORTANT: Do NOT move or delete this repo directory ($SRC)."
echo "The config above uses symlinks — moving the repo will break them."
