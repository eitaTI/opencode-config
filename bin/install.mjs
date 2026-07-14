#!/usr/bin/env node
// EitaTI — OpenCode global config installer (cross-platform).
// Run via:  npx github:EitaTI/opencode-config
// Works on Windows, macOS and Linux. Copies opencode.jsonc, skills/
// and docs/ into the OpenCode global config dir, and installs the
// Superpowers orchestrator via git-backed plugin. Requires Node.js/npm + uv
// (and ruff for the Python LSP) to be installed beforehand — it checks for
// them and prints install instructions for any that are missing, then asks
// you to re-run.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const SOURCE_ITEMS = ["opencode.jsonc", "skills", "docs"];
const ENV_LINE = "export OPENCODE_EXPERIMENTAL_LSP_TOOL=true";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const isWin = process.platform === "win32";
const log = (...a) => console.log("==>", ...a);
const warn = (...a) => console.warn("  (warn)", ...a);

function isArchBased() {
  if (process.platform !== "linux") return false;
  try {
    const pacmanCheck = spawnSync("which", ["pacman"], { stdio: "pipe" });
    return pacmanCheck.status === 0;
  } catch {
    return false;
  }
}

function resolveTargetDir() {
  if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR;
  if (process.env.OPENCODE_CONFIG) return path.dirname(process.env.OPENCODE_CONFIG);
  if (isWin) {
    const base =
      process.env.LOCALAPPDATA || process.env.APPDATA ||
      path.join(os.homedir(), "AppData", "Roaming");
    return path.join(base, "opencode");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "opencode");
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(xdg, "opencode");
}

function which(cmd) {
  try {
    const r = isWin
      ? spawnSync("where", [cmd], { stdio: "pipe" })
      : spawnSync("which", [cmd], { stdio: "pipe" });
    return r.status === 0 ? r.stdout.toString().trim().split("\n")[0] : null;
  } catch {
    return null;
  }
}

function run(cmd, args, opts = {}) {
  const full = isWin ? `${cmd}.exe` : cmd;
  // spawnSync searches PATH on every platform and passes `args` safely
  // (execSync ignores an `args` option, which silently dropped every
  // argument — e.g. setx). Throws on failure
  // so callers can catch non-fatal steps.
  const r = spawnSync(full, args, { stdio: "inherit", ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0 && r.status !== null) {
    throw new Error(`command failed (status ${r.status}): ${full} ${args.join(" ")}`);
  }
  return r;
}

function copyRecursive(src, dest) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const e of fs.readdirSync(src)) {
      copyRecursive(path.join(src, e), path.join(dest, e));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// ---------------------------------------------------------------------------
// prerequisite checks (no auto-install — keeps the installer simple)
// ---------------------------------------------------------------------------
// Tools the installed config depends on. The installer only checks for them
// and prints install instructions when any are missing; it never installs.
function getNodeInstallCmd() {
  if (isWin) return 'powershell -c "winget install OpenJS.NodeJS.LTS"';
  if (isArchBased()) return "sudo pacman -S nodejs npm";
  return "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs";
}

const PREREQS = [
  {
    name: "node",
    note: "JavaScript runtime for npx-based MCP servers + LSP + Superpowers",
    get win() { return 'powershell -c "winget install OpenJS.NodeJS.LTS"'; },
    get unix() { return getNodeInstallCmd(); },
  },
  {
    name: "uv",
    note: "runs the official Python fetch MCP server via uvx",
    win: 'powershell -c "irm https://astral.sh/uv/install.ps1 | iex"',
    unix: "curl -LsSf https://astral.sh/uv/install.sh | sh",
  },
  {
    name: "ruff",
    note: "Python LSP + formatter used by the config",
    win: 'powershell -c "irm https://astral.sh/ruff/install.ps1 | iex"',
    unix: "curl -LsSf https://astral.sh/ruff/install.sh | sh",
  },
];

function checkPrerequisites() {
  return PREREQS.filter((p) => !which(p.name));
}

function printPrerequisiteHelp(missing) {
  const osLabel = isWin ? "Windows" : isArchBased() ? "Arch-based Linux (CachyOS, EndeavourOS, etc.)" : "macOS / Linux (Debian/Ubuntu)";
  console.log(`
Missing required tool(s) (detected OS: ${osLabel}). The installed config depends on them:
`);
  for (const p of missing) {
    const cmd = isWin ? p.win : p.unix;
    console.log(`  • ${p.name} — ${p.note}`);
    console.log(`      ${cmd}`);
  }
  console.log(`
Install the above, then re-run:

  npx github:EitaTI/opencode-config
`);
}

function setEnvVar() {
  log("Enabling experimental LSP tool flag...");
  if (isWin) {
    // Persistent user env var on Windows.
    run("setx", ["OPENCODE_EXPERIMENTAL_LSP_TOOL", "true"]);
    return;
  }
  for (const rc of [path.join(os.homedir(), ".bashrc"), path.join(os.homedir(), ".zshrc"), path.join(os.homedir(), ".profile")]) {
    if (!fs.existsSync(rc)) continue;
    const txt = fs.readFileSync(rc, "utf8");
    if (txt.includes("OPENCODE_EXPERIMENTAL_LSP_TOOL")) continue;
    fs.appendFileSync(rc, `\n# >>> opencode-config >>>\n${ENV_LINE}\n# <<< opencode-config <<<\n`);
    log(`Added ${ENV_LINE} to ${rc}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function printHelp() {
  console.log(`
EitaTI — OpenCode global config installer

Usage:
  npx github:EitaTI/opencode-config [--dry-run]

Options:
  --dry-run     Print what would happen without writing files (still
                reports missing prerequisites).
  -h, --help    Show this help.

What it does:
  1. Checks that Node.js, uv and ruff are installed (prints install
     commands for any that are missing, then stops).
  2. Copies opencode.jsonc, skills/ and docs/ into the OpenCode
     global config dir (~/.config/opencode on Linux, etc.).
  3. Installs the Superpowers multi-agent orchestrator via git-backed plugin.
  4. Enables the experimental LSP tool flag
     (OPENCODE_EXPERIMENTAL_LSP_TOOL).
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) return printHelp();
  const dry = args.includes("--dry-run");

  // Prerequisite check — Node.js/uv/ruff must already be installed.
  const missing = checkPrerequisites();
  if (missing.length) {
    if (dry) {
      warn("dry-run: missing prerequisites (config would still be copied):");
      for (const p of missing) warn(`  ${p.name} not found`);
    } else {
      printPrerequisiteHelp(missing);
      console.error("\nAborting. Install the tools above, then re-run the command.");
      process.exit(1);
    }
  }

  const target = resolveTargetDir();
  log(`Target OpenCode config dir: ${target}`);

  for (const item of SOURCE_ITEMS) {
    const src = path.join(REPO_ROOT, item);
    if (!fs.existsSync(src)) { warn(`source missing: ${item} (skipped)`); continue; }
    const dest = path.join(target, item);
    if (dry) { log(`[dry-run] would copy ${src} -> ${dest}`); continue; }
    copyRecursive(src, dest);
    log(`Copied ${item} -> ${target}`);
  }

  if (dry) {
    log("[dry-run] would set env var. Done.");
    return;
  }

  log("Superpowers orchestrator will be installed by OpenCode via plugin system");
  setEnvVar();

  console.log(`
Done. Config installed into:
  ${target}

Verify with:
  opencode mcp list
  opencode debug config
`);
}

main();
