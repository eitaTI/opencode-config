#!/usr/bin/env node
// EitaTI — OpenCode global config installer (cross-platform).
// Run via:  npx github:EitaTI/opencode-config
// Works on Windows, macOS and Linux. Copies opencode.jsonc, skills/,
// commands/ and docs/ into the OpenCode global config dir (~/.config/opencode).
// Requires Node.js/npm + uv + ruff to be installed beforehand — it checks for
// them and prints install instructions for any that are missing, then asks
// you to re-run. rtk is recommended but optional (warns instead of aborting).

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const SOURCE_ITEMS = ["opencode.jsonc", "skills", "commands", "docs", "AGENTS.md"];

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

// OpenCode uses ~/.config/opencode on ALL platforms (XDG convention).
// The only exception is macOS where it could use ~/Library/Application Support,
// but the user confirmed ~/.config/opencode works on their Windows setup.
function resolveTargetDir() {
  if (process.env.OPENCODE_CONFIG_DIR) return process.env.OPENCODE_CONFIG_DIR;
  if (process.env.OPENCODE_CONFIG) return path.dirname(process.env.OPENCODE_CONFIG);
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

function rmrf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    return true;
  }
  return false;
}

function cleanTarget(target, dry) {
  const runtimeFiles = ["opencode-mem.jsonc", "dcp.jsonc", "smart-title.jsonc"];
  const systemFiles = ["package.json", "package-lock.json"];
  const systemDir = "node_modules";

  const toRemove = [];

  // Config files from repo (will be re-copied)
  for (const item of SOURCE_ITEMS) {
    const p = path.join(target, item);
    if (fs.existsSync(p)) toRemove.push(p);
  }

  // Plugin runtime files
  for (const f of runtimeFiles) {
    const p = path.join(target, f);
    if (fs.existsSync(p)) toRemove.push(p);
  }

  // Plugin system files
  for (const f of systemFiles) {
    const p = path.join(target, f);
    if (fs.existsSync(p)) toRemove.push(p);
  }
  const nmDir = path.join(target, systemDir);
  if (fs.existsSync(nmDir)) toRemove.push(nmDir);

  if (toRemove.length === 0) {
    log("Nothing to clean (target is already empty)");
    return;
  }

  if (dry) {
    for (const p of toRemove) log(`[dry-run] would remove ${path.relative(target, p)}`);
    return;
  }

  for (const p of toRemove) {
    rmrf(p);
    log(`Removed ${path.relative(target, p)}`);
  }
}

function backupTarget(target) {
  if (!fs.existsSync(target)) return null;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = `${target}.backup-${timestamp}`;
  fs.cpSync(target, backupDir, { recursive: true });
  log(`Backup created: ${backupDir}`);
  return backupDir;
}

function hasExistingConfig(target) {
  if (!fs.existsSync(target)) return false;
  const items = fs.readdirSync(target);
  return items.some((f) => SOURCE_ITEMS.includes(f));
}

// ---------------------------------------------------------------------------
// prerequisite checks
// ---------------------------------------------------------------------------
// Core tools: installer aborts if missing.
// Optional tools: installer warns but continues.
function getNodeInstallCmd() {
  if (isWin) return 'powershell -c "winget install OpenJS.NodeJS.LTS"';
  if (isArchBased()) return "sudo pacman -S nodejs npm";
  return "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs";
}

const PREREQS_CORE = [
  {
    name: "node",
    note: "JavaScript runtime for npx-based MCP servers + LSP",
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

const PREREQS_OPTIONAL = [
  {
    name: "rtk",
    note: "filters shell output to reduce LLM token consumption by 60-90% (recommended)",
    win: 'powershell -c "irm https://rtk-ai.app/install.ps1 | iex"',
    unix: "curl -fsSL https://rtk-ai.app/install.sh | sh",
  },
];

function checkPrerequisites() {
  const core = PREREQS_CORE.filter((p) => !which(p.name));
  const optional = PREREQS_OPTIONAL.filter((p) => !which(p.name));
  return { core, optional };
}

function printPrerequisiteHelp(missing, label) {
  const osLabel = isWin ? "Windows" : isArchBased() ? "Arch-based Linux" : "macOS / Linux";
  console.log(`
${label} tool(s) missing (${osLabel}):
`);
  for (const p of missing) {
    const cmd = isWin ? p.win : p.unix;
    console.log(`  ${p.name} — ${p.note}`);
    console.log(`    ${cmd}`);
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function printHelp() {
  console.log(`
EitaTI — OpenCode global config installer

Usage:
  npx github:EitaTI/opencode-config [--dry-run] [--clean] [--force]

Options:
  --dry-run     Preview what would happen without writing files.
  --clean       Remove ALL config files (no reinstall).
  --force       Overwrite existing config without prompting.
  -h, --help    Show this help.

What it does:
  1. Checks for required tools (Node.js, uv, ruff). rtk is optional.
  2. If target dir has existing config, prompts for confirmation (or --force).
  3. Creates a timestamped backup before overwriting.
  4. Copies config files to ~/.config/opencode.

  With --clean, removes everything without reinstalling:
  - Config files (opencode.jsonc, skills/, commands/, docs/, AGENTS.md)
  - Plugin runtime files (opencode-mem.jsonc, dcp.jsonc, smart-title.jsonc)
  - Plugin system files (package.json, package-lock.json, node_modules/)
  To reinstall after cleaning, run the command without --clean.
`);
}

function promptUser(question) {
  // Synchronous stdin read for CLI prompt
  const rl = (() => {
    try {
      return require("node:readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });
    } catch {
      return null;
    }
  })();
  if (!rl) return true; // fallback to --force behavior if readline unavailable
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^(y|yes|s|sim)$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) return printHelp();
  const dry = args.includes("--dry-run");
  const clean = args.includes("--clean");
  const force = args.includes("--force");

  // Prerequisite check — core tools must be installed.
  const { core, optional } = checkPrerequisites();
  if (core.length) {
    if (dry) {
      warn("dry-run: missing core prerequisites (config would still be copied):");
      for (const p of core) warn(`  ${p.name} not found`);
    } else {
      printPrerequisiteHelp(core, "Required");
      console.error("\nInstall the tools above, then re-run the command.");
      process.exit(1);
    }
  }

  // Optional tools — warn but continue.
  if (optional.length && !dry) {
    printPrerequisiteHelp(optional, "Optional");
    console.log("\nContinuing without optional tools. Install them later for better token savings.\n");
  }

  const target = resolveTargetDir();
  log(`Installing to: ${target}`);

  if (clean) {
    cleanTarget(target, dry);
    if (dry) {
      log("[dry-run] Done.");
    } else {
      console.log(`
Clean complete! Removed all config from:
  ${target}

To reinstall, run:
  npx github:EitaTI/opencode-config
`);
    }
    return;
  }

  // Check for existing config and handle overwriting.
  if (!dry && hasExistingConfig(target) && !force) {
    warn(`Target directory already has OpenCode config: ${target}`);
    const answer = await promptUser("Overwrite existing config? (y/N) ");
    if (!answer) {
      console.log("Aborted. Use --force to overwrite without prompting.");
      process.exit(0);
    }
    backupTarget(target);
  }

  for (const item of SOURCE_ITEMS) {
    const src = path.join(REPO_ROOT, item);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(target, item);
    if (dry) { log(`[dry-run] would copy ${item}`); continue; }
    copyRecursive(src, dest);
    log(`Copied ${item}`);
  }

  if (dry) {
    log("[dry-run] Done.");
    return;
  }

  console.log(`
Done! Config installed to:
  ${target}

Verify with:
  opencode mcp list
  opencode debug config
`);
}

main();
