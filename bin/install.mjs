#!/usr/bin/env node
// EitaTI — OpenCode global config installer (cross-platform).
// Run via:  npx github:EitaTI/opencode-config
// Works on Windows, macOS and Linux. Copies opencode.jsonc, skills/,
// commands/ and docs/ into the OpenCode global config dir (~/.config/opencode).
// Auto-installs missing prerequisites (Node.js, uv, ruff, rtk) unless
// --no-auto-install is specified.

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

function detectDistro() {
  if (process.platform !== "linux") return "unknown";
  try {
    if (spawnSync("which", ["pacman"], { stdio: "pipe" }).status === 0) return "arch";
    if (spawnSync("which", ["apt-get"], { stdio: "pipe" }).status === 0) return "debian";
    if (spawnSync("which", ["dnf"], { stdio: "pipe" }).status === 0) return "fedora";
    if (spawnSync("which", ["zypper"], { stdio: "pipe" }).status === 0) return "suse";
  } catch {}
  return "unknown";
}

// OpenCode uses ~/.config/opencode on ALL platforms (XDG convention).
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

function runCommand(cmd, args, opts = {}) {
  log(`Running: ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.error) throw r.error;
  return r.status === 0;
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
// prerequisite checks + auto-install
// ---------------------------------------------------------------------------
function getNodeInstallCmd() {
  if (isWin) return { cmd: "powershell", args: ["-c", "winget install OpenJS.NodeJS.LTS"] };
  const distro = detectDistro();
  switch (distro) {
    case "arch":
      return { cmd: "sudo", args: ["pacman", "-S", "--noconfirm", "nodejs", "npm"] };
    case "debian":
      return { cmd: "bash", args: ["-c", "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"] };
    case "fedora":
      return { cmd: "sudo", args: ["dnf", "install", "-y", "nodejs", "npm"] };
    case "suse":
      return { cmd: "sudo", args: ["zypper", "install", "-y", "nodejs", "npm"] };
    default:
      return null;
  }
}

function getLinuxBrewCmd() {
  // Check if Homebrew is installed on Linux (Linuxbrew)
  try {
    const r = spawnSync("which", ["brew"], { stdio: "pipe" });
    if (r.status === 0) return { cmd: "brew", args: ["install", "node"] };
  } catch {}
  return null;
}

function getMacNodeInstallCmd() {
  // Check if Homebrew is installed
  try {
    const r = spawnSync("which", ["brew"], { stdio: "pipe" });
    if (r.status === 0) return { cmd: "brew", args: ["install", "node"] };
  } catch {}
  return null;
}

const PREREQS_CORE = [
  {
    name: "node",
    note: "JavaScript runtime for npx-based MCP servers + LSP",
    getInstallCmd() {
      if (isWin) return { cmd: "powershell", args: ["-c", "winget install OpenJS.NodeJS.LTS"] };
      if (process.platform === "darwin") return getMacNodeInstallCmd();
      return getNodeInstallCmd();
    },
  },
  {
    name: "uv",
    note: "runs the official Python fetch MCP server via uvx",
    getInstallCmd() {
      if (isWin) return { cmd: "powershell", args: ["-c", "irm https://astral.sh/uv/install.ps1 | iex"] };
      return { cmd: "bash", args: ["-c", "curl -LsSf https://astral.sh/uv/install.sh | sh"] };
    },
  },
  {
    name: "ruff",
    note: "Python LSP + formatter used by the config",
    getInstallCmd() {
      if (isWin) return { cmd: "powershell", args: ["-c", "irm https://astral.sh/ruff/install.ps1 | iex"] };
      return { cmd: "bash", args: ["-c", "curl -LsSf https://astral.sh/ruff/install.sh | sh"] };
    },
  },
];

const PREREQS_OPTIONAL = [
  {
    name: "rtk",
    note: "filters shell output to reduce LLM token consumption by 60-90% (recommended)",
    getInstallCmd() {
      // Windows: download pre-built binary from GitHub releases
      if (isWin) {
        return {
          cmd: "powershell",
          args: ["-c", "$ProgressPreference='SilentlyContinue'; $v='0.43.0'; $url=\"https://github.com/rtk-ai/rtk/releases/download/v$v/rtk-x86_64-pc-windows-msvc.zip\"; Invoke-WebRequest -Uri $url -OutFile \"$env:TEMP\\rtk.zip\"; Expand-Archive -Path \"$env:TEMP\\rtk.zip\" -DestinationPath \"$env:USERPROFILE\\.local\\bin\" -Force; if ($env:PATH -notmatch [regex]::Escape($env:USERPROFILE+'\\.local\\bin')) { [Environment]::SetEnvironmentVariable('PATH', $env:PATH+';'+$env:USERPROFILE+'\\.local\\bin', 'User') }"],
        };
      }
      return { cmd: "bash", args: ["-c", "curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"] };
    },
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
    const installCmd = p.getInstallCmd();
    const cmdStr = installCmd ? `${installCmd.cmd} ${installCmd.args.join(" ")}` : "manual install required";
    console.log(`  ${p.name} — ${p.note}`);
    console.log(`    ${cmdStr}`);
  }
}

async function autoInstall(missing) {
  for (const p of missing) {
    const installCmd = p.getInstallCmd();
    if (!installCmd) {
      warn(`No auto-install command available for ${p.name} — install manually`);
      continue;
    }

    log(`Installing ${p.name}...`);
    try {
      const success = runCommand(installCmd.cmd, installCmd.args);
      if (success) {
        log(`${p.name} installed successfully`);
      } else {
        warn(`Failed to install ${p.name} — install manually`);
      }
    } catch (err) {
      warn(`Error installing ${p.name}: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function printHelp() {
  console.log(`
EitaTI — OpenCode global config installer

Usage:
  npx github:EitaTI/opencode-config [options]

Options:
  --dry-run           Preview what would happen without writing files.
  --clean             Remove ALL config files (no reinstall).
  --force             Overwrite existing config without prompting.
  --no-auto-install   Don't auto-install missing prerequisites (just print commands).
  -h, --help          Show this help.

What it does:
  1. Checks for required tools (Node.js, uv, ruff). rtk is optional.
  2. Auto-installs missing prerequisites (unless --no-auto-install).
  3. If target dir has existing config, prompts for confirmation (or --force).
  4. Creates a timestamped backup before overwriting.
  5. Copies config files to ~/.config/opencode.

  With --clean, removes everything without reinstalling:
  - Config files (opencode.jsonc, skills/, commands/, docs/, AGENTS.md)
  - Plugin runtime files (opencode-mem.jsonc, dcp.jsonc, smart-title.jsonc)
  - Plugin system files (package.json, package-lock.json, node_modules/)
  To reinstall after cleaning, run the command without --clean.
`);
}

function promptUser(question) {
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
  const noAutoInstall = args.includes("--no-auto-install");

  // Prerequisite check — core tools must be installed.
  const { core, optional } = checkPrerequisites();

  if (core.length) {
    if (dry) {
      warn("dry-run: missing core prerequisites (config would still be copied):");
      for (const p of core) warn(`  ${p.name} not found`);
    } else if (noAutoInstall) {
      printPrerequisiteHelp(core, "Required");
      console.error("\nInstall the tools above, then re-run the command.");
      process.exit(1);
    } else {
      log(`Missing core prerequisites: ${core.map((p) => p.name).join(", ")}`);
      await autoInstall(core);

      // Re-check after install
      const stillMissing = PREREQS_CORE.filter((p) => !which(p.name));
      if (stillMissing.length) {
        printPrerequisiteHelp(stillMissing, "Still missing");
        console.error("\nAuto-install failed for the tools above. Install manually, then re-run.");
        process.exit(1);
      }
    }
  }

  // Optional tools — auto-install if enabled, warn otherwise.
  if (optional.length && !dry) {
    if (noAutoInstall) {
      printPrerequisiteHelp(optional, "Optional");
      console.log("\nContinuing without optional tools. Install them later for better token savings.\n");
    } else {
      log(`Installing optional tools: ${optional.map((p) => p.name).join(", ")}`);
      await autoInstall(optional);
    }
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
