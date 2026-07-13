#!/usr/bin/env -S bun run
// EitaTI — OpenCode global config installer (cross-platform).
// Run via:  npx github:EitaTI/opencode-config
//            bunx github:EitaTI/opencode-config
// Works on Windows, macOS and Linux. Copies opencode.jsonc, skills/
// and docs/ into the OpenCode global config dir, and installs Bun + ruff
// + the oh-my-opencode-slim orchestrator.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync, spawnSync } from "node:child_process";
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

function prependPath(dir) {
  if (!dir) return;
  const sep = isWin ? ";" : ":";
  process.env.PATH = `${dir}${sep}${process.env.PATH || ""}`;
}

function run(cmd, args, opts = {}) {
  const full = isWin ? `${cmd}.exe` : cmd;
  return execSync(full, { args, stdio: "inherit", ...opts });
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
// OS-specific bootstrappers
// ---------------------------------------------------------------------------
function installBun() {
  log("Installing Bun (https://bun.sh)...");
  if (isWin) {
    run("powershell", ["-NoProfile", "-Command", "irm https://bun.sh/install.ps1 | iex"]);
  } else {
    execSync("sh", ["-c", "curl -fsSL https://bun.sh/install | bash"], { stdio: "inherit" });
  }
  const candidates = isWin
    ? [path.join(os.homedir(), ".bun", "bin"), path.join(process.env.LOCALAPPDATA || "", ".bun", "bin")]
    : [path.join(os.homedir(), ".bun", "bin")];
  for (const c of candidates) if (fs.existsSync(c)) { prependPath(c); break; }
}

function installRuff() {
  log("Installing ruff (standalone binary)...");
  if (isWin) {
    run("powershell", ["-NoProfile", "-Command", "irm https://astral.sh/ruff/install.ps1 | iex"]);
  } else {
    execSync("sh", ["-c", "curl -LsSf https://astral.sh/ruff/install.sh | sh"], { stdio: "inherit" });
  }
  const candidates = isWin
    ? [path.join(os.homedir(), ".ruff", "bin"), path.join(process.env.USERPROFILE || "", ".ruff", "bin")]
    : [path.join(os.homedir(), ".local", "bin"), path.join(os.homedir(), ".ruff", "bin")];
  for (const c of candidates) if (fs.existsSync(c)) { prependPath(c); break; }
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
  bunx github:EitaTI/opencode-config [--dry-run]

Options:
  --dry-run     Print what would happen without installing Bun/ruff
                or writing files.
  -h, --help    Show this help.

What it does:
  1. Copies opencode.jsonc, skills/ and docs/ into the OpenCode
     global config dir (~/.config/opencode on Linux, etc.).
  2. Installs Bun (if missing) — single runner for MCP servers + plugins.
  3. Installs ruff (if missing) — Python LSP + formatter.
  4. Materializes the oh-my-opencode-slim multi-agent orchestrator.
  5. Enables the experimental LSP tool flag
     (OPENCODE_EXPERIMENTAL_LSP_TOOL).
`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) return printHelp();
  const dry = args.includes("--dry-run");

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
    log("[dry-run] would install Bun + ruff, run oh-my-opencode-slim, and set env var. Done.");
    return;
  }

  if (!which("bun")) installBun();
  else log(`Bun already present: ${which("bun")}`);

  if (!which("ruff")) installRuff();
  else log(`ruff already present: ${which("ruff")}`);

  log("Setting up oh-my-opencode-slim (multi-agent orchestrator)...");
  try {
    run("bunx", ["oh-my-opencode-slim@latest", "install"]);
  } catch {
    warn("oh-my-opencode-slim install failed; run manually: bunx oh-my-opencode-slim@latest install");
  }

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
