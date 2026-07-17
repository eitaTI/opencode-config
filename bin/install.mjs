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

const PKG = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
const VERSION = PKG.version;

const SOURCE_ITEMS = ["opencode.jsonc", "plugins", "skills", "commands", "docs", "AGENTS.md"];

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
  const r = spawnSync(cmd, args, { stdio: ["inherit", "pipe", "pipe"], ...opts });
  const out = (r.stdout ? r.stdout.toString() : "") + (r.stderr ? r.stderr.toString() : "");
  if (r.error) throw r.error;
  return { ok: r.status === 0, out };
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

// true if target contains files not managed by this installer (user's own config)
function hasForeignFiles(target) {
  if (!fs.existsSync(target)) return false;
  const items = fs.readdirSync(target);
  return items.some((f) => !SOURCE_ITEMS.includes(f) && !f.endsWith(".backup-") && f !== "node_modules");
}

// ---------------------------------------------------------------------------
// prerequisite checks + auto-install
// ---------------------------------------------------------------------------
function getNodeInstallCmd() {
  if (isWin) return { cmd: "powershell", args: ["-c", "winget install OpenJS.NodeJS.LTS"] };
  const distro = detectDistro();
  switch (distro) {
    case "arch":
      // Prefer FNM over pacman — avoids /usr conflicts, allows version switching.
      if (which("fnm")) return { cmd: "bash", args: ["-c", "fnm install --lts && fnm use lts-latest"] };
      if (which("nvm")) return { cmd: "bash", args: ["-c", "nvm install --lts && nvm use --lts"] };
      // Fallback: install FNM (Rust binary, zero dependencies)
      return { cmd: "bash", args: ["-c", "curl -fsSL https://fnm.vercel.app/install | bash && export PATH=\"$HOME/.local/share/fnm:$PATH\" && eval \"$(fnm env)\" && fnm install --lts && fnm use lts-latest"] };
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
    // Windows-only: on Linux/macOS git is assumed present. On Windows we
    // install Git for Windows (via winget) which also ships a GNU toolchain
    // (grep/head/tail/sed/awk/ls/cat) under usr\bin — exposed on PATH so the
    // existing Unix permission patterns + rtk keep working inside pwsh.
    name: "git",
    note: "version control + GNU tools (grep/head/tail/sed) used inside pwsh",
    getInstallCmd() {
      if (!isWin) return null;
      if (which("winget")) {
        return {
          cmd: "powershell",
          args: ["-c", "winget install Git.Git --silent --accept-package-agreements --accept-source-agreements"],
        };
      }
      // Fallback: resolve latest Git for Windows release at runtime, then
      // download + run the Inno Setup installer silently.
      return {
        cmd: "powershell",
        args: ["-c",
          "$ProgressPreference='SilentlyContinue'; " +
          "$release = Invoke-RestMethod -Uri 'https://api.github.com/repos/git-for-windows/git/releases/latest'; " +
          "$asset = $release.assets | Where-Object { $_.name -match '^Git-.*-64-bit\\.exe$' } | Select-Object -First 1; " +
          "if (-not $asset) { throw 'Could not find Git for Windows 64-bit installer asset' }; " +
          "Invoke-WebRequest -Uri $asset.browser_download_url -OutFile \"$env:TEMP\\git-install.exe\"; " +
          "Start-Process \"$env:TEMP\\git-install.exe\" -ArgumentList '/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS=\"icons,ext\\reg\\shellhere,assoc,assoc_sh\"' -Wait"
        ],
      };
    },
  },
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
      if (isArchBased()) return { cmd: "sudo", args: ["pacman", "-S", "--noconfirm", "python-ruff"] };
      return { cmd: "bash", args: ["-c", "curl -LsSf https://astral.sh/ruff/install.sh | sh"] };
    },
    // On Arch, if pacman fails (e.g. broken mirror), retry via the AUR helper
    // (yay|paru). Installs stay exclusive to pacman/AUR — never standalone/npm.
    getFallbackInstallCmds() {
      if (!isArchBased()) return [];
      const h = getAurHelper();
      return h ? [{ cmd: h, args: aurInstallArgs("python-ruff") }] : [];
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
          args: ["-c", "$ProgressPreference='SilentlyContinue'; $v='0.43.0'; $url=\"https://github.com/rtk-ai/rtk/releases/download/v$v/rtk-x86_64-pc-windows-msvc.zip\"; Invoke-WebRequest -Uri $url -OutFile \"$env:TEMP\\rtk.zip\"; Add-Type -AssemblyName System.IO.Compression.FileSystem; if (Test-Path \"$env:USERPROFILE\\.local\\bin\\rtk.exe\") { Remove-Item \"$env:USERPROFILE\\.local\\bin\\rtk.exe\" -Force }; [System.IO.Compression.ZipFile]::ExtractToDirectory(\"$env:TEMP\\rtk.zip\", \"$env:USERPROFILE\\.local\\bin\"); if ($env:PATH -notmatch [regex]::Escape($env:USERPROFILE+'\\.local\\bin')) { [Environment]::SetEnvironmentVariable('PATH', $env:PATH+';'+$env:USERPROFILE+'\\.local\\bin', 'User') }"],
        };
      }
      // Arch/CachyOS: rtk is AUR-only (aur/rtk-bin), install via paru/yay
      // Use rtk-bin to avoid provider selection prompts (--noconfirm doesn't cover that)
      if (isArchBased()) {
        const h = getAurHelper();
        return h ? { cmd: h, args: aurInstallArgs("rtk-bin") } : null;
      }
      return { cmd: "bash", args: ["-c", "curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"] };
    },
  },
];

// LSPs invoked *directly* by opencode.jsonc that need a real binary on PATH.
// LSPs run via `npx -y` (basedpyright, tailwindcss, emmet, eslint-lsp,
// vtsls, docker-langserver, vscode-*) are downloaded on demand and
// intentionally excluded here.
// On Arch/CachyOS we prefer pacman/AUR (yay|paru) over `npm i -g`,
// which writes outside pacman's control and can break system updates.
function getAurHelper() {
  if (which("paru")) return "paru";
  if (which("yay")) return "yay";
  return null;
}

// Build AUR helper install args with the correct "skip review" flag.
// `paru` accepts `--skipreview`; `yay` requires `--noansweredit`.
function aurInstallArgs(pkg) {
  const h = getAurHelper();
  const editFlag = h === "yay" ? "--noansweredit" : "--skipreview";
  return ["-S", "--noconfirm", editFlag, pkg];
}

// Refresh pacman's package databases (helps when a stale/cached DB points at
// files that no longer resolve on the configured mirrors).
function refreshPacman() {
  try {
    const r = spawnSync("sudo", ["pacman", "-Sy"], { stdio: ["inherit", "pipe", "pipe"] });
    if (r.status !== 0) warn("pacman -Sy failed; continuing...");
  } catch {
    // Non-fatal: the install attempt below will surface any real errors.
  }
}

// Re-expose node/npm on PATH when they were just installed via FNM/nvm
// in this same run (the current process env isn't auto-updated). Needed
// before the `npm i -g` LSP step on a system that lacked Node.
function refreshPath() {
  if (which("npm")) return;
  if (isWin) return;
  for (const helper of ["fnm", "nvm"]) {
    if (!which(helper)) continue;
    try {
      const out = spawnSync("bash", ["-lc", `eval "$( ${helper} env )" 2>/dev/null; echo "PATH=$PATH"`], { stdio: "pipe" });
      const m = /PATH=(.*)/.exec(out.stdout.toString());
      if (m) process.env.PATH = m[1] + (process.env.PATH ? ":" + process.env.PATH : "");
    } catch {}
    if (which("npm")) return;
  }
}

// Re-read PATH from the registry (User + Machine) into the current process
// after a Windows installer (winget) updated it — the current Node process
// env isn't auto-refreshed.
function refreshWindowsPath() {
  try {
    const r = spawnSync("powershell", ["-c",
      "$u=[Environment]::GetEnvironmentVariable('Path','User'); " +
      "$m=[Environment]::GetEnvironmentVariable('Path','Machine'); " +
      "($u+';'+$m).Split(';') | Where-Object { $_ } | Select-Object -Unique"
    ], { stdio: "pipe" });
    const newPath = r.stdout.toString().trim();
    if (newPath) process.env.PATH = newPath;
  } catch {}
}

function getUserEnvPath() {
  try {
    const r = spawnSync("powershell", ["-c",
      "[Environment]::GetEnvironmentVariable('Path','User')"], { stdio: "pipe" });
    return r.stdout.toString().trim();
  } catch {
    return "";
  }
}

function setUserEnvVar(name, value) {
  try {
    spawnSync("powershell", ["-c",
      `[Environment]::SetEnvironmentVariable('${name}', '${value.replace(/'/g, "''")}', 'User')`
    ], { stdio: "inherit" });
  } catch {}
}

// After Git for Windows is installed on Windows: expose its GNU toolchain
// (grep/head/tail/sed/awk/ls/cat under usr\bin) on the user PATH so the
// familiar Unix command set works inside pwsh. Appended to the END of PATH
// so it never overrides Windows built-ins (e.g. find.exe in System32).
// Also sets OPENCODE_GIT_BASH_PATH (workaround for OpenCode issue #10871)
// in case the user later switches to a bash shell.
function configureWindowsGit() {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const gitUsrBin = path.join(programFiles, "Git", "usr", "bin");
  if (fs.existsSync(gitUsrBin)) {
    const userPath = getUserEnvPath();
    const entries = userPath ? userPath.split(";").filter(Boolean) : [];
    const already = entries.some((p) => p.toLowerCase() === gitUsrBin.toLowerCase());
    if (!already) {
      const newPath = userPath ? `${userPath};${gitUsrBin}` : gitUsrBin;
      setUserEnvVar("Path", newPath);
      process.env.PATH += `;${gitUsrBin}`;
      log(`Added Git GNU tools to PATH: ${gitUsrBin}`);
    }
  }
  const bashPath = path.join(programFiles, "Git", "bin", "bash.exe");
  if (fs.existsSync(bashPath)) {
    setUserEnvVar("OPENCODE_GIT_BASH_PATH", bashPath);
    process.env.OPENCODE_GIT_BASH_PATH = bashPath;
    log(`Set OPENCODE_GIT_BASH_PATH=${bashPath}`);
  }
}

const LSP_SERVERS = [
  {
    name: "bash-language-server",
    note: "Bash/Shell LSP (bash-language-server start)",
    getInstallCmd() {
      if (isArchBased()) return { cmd: "sudo", args: ["pacman", "-S", "--noconfirm", "bash-language-server"] };
      return { cmd: "npm", args: ["i", "-g", "bash-language-server"] };
    },
    getFallbackInstallCmds() {
      if (!isArchBased()) return [];
      const h = getAurHelper();
      return h ? [{ cmd: h, args: aurInstallArgs("bash-language-server") }] : [];
    },
  },
  {
    name: "yaml-language-server",
    note: "YAML LSP (yaml-language-server --stdio)",
    getInstallCmd() {
      if (isArchBased()) return { cmd: "sudo", args: ["pacman", "-S", "--noconfirm", "yaml-language-server"] };
      return { cmd: "npm", args: ["i", "-g", "yaml-language-server"] };
    },
    getFallbackInstallCmds() {
      if (!isArchBased()) return [];
      const h = getAurHelper();
      return h ? [{ cmd: h, args: aurInstallArgs("yaml-language-server") }] : [];
    },
  },
];

function checkLSPs() {
  return LSP_SERVERS.filter((p) => !which(p.name));
}

function checkPrerequisites() {
  const core = PREREQS_CORE.filter((p) => !which(p.name));
  const optional = PREREQS_OPTIONAL.filter((p) => !which(p.name));
  return { core, optional };
}

function printPrerequisiteHelp(missing, label) {
  console.log(`\n  ${label}:`);
  for (const p of missing) console.log(`    ${p.name} — ${p.note}`);
}

// Return the last N lines of a string.
function tailLines(str, n = 12) {
  const lines = str.trim().split("\n");
  return lines.slice(-n).join("\n");
}

async function autoInstall(missing) {
  for (const p of missing) {
    const attempts = [p.getInstallCmd(), ...(p.getFallbackInstallCmds ? p.getFallbackInstallCmds() : [])].filter(Boolean);
    if (attempts.length === 0) {
      console.log(`  ${p.name} — no auto-install available (manual)`);
      continue;
    }

    let installed = false;
    let lastOut = "";
    for (const installCmd of attempts) {
      try {
        const { ok, out } = runCommand(installCmd.cmd, installCmd.args);
        lastOut = out;
        if (ok) { installed = true; break; }
      } catch (err) {
        lastOut = err.message;
      }
    }

    if (installed) {
      console.log(`  ${p.name} — ok`);
      continue;
    }

    // Diagnostic: detect a broken-mirror / missing-signature failure (Arch)
    if (/falha ao obter|\.sig|404|failed to retrieve|signature|GPG|corrupted|unable to verify/i.test(lastOut)) {
      console.log(`  ${p.name} — FAIL (broken mirror / missing .sig)`);
      console.log(`
  Fix your mirror/keyring, then re-run:

    sudo pacman -Syy && sudo pacman-key --refresh-keys
    sudo cachyos-rate-mirrors    # or: sudo reflector --latest 10 --sort rate --save /etc/pacman.d/mirrorlist
    npx -y github:EitaTI/opencode-config
`);
    } else {
      console.log(`  ${p.name} — FAIL`);
      if (lastOut.trim()) console.log(`    ${tailLines(lastOut, 6).split("\n").join("\n    ")}`);
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
   1. Checks for required tools (Node.js, uv, ruff; Git on Windows). rtk is optional.
   2. Auto-installs missing prerequisites (unless --no-auto-install). On Windows,
      Git for Windows is installed via winget and its GNU tools (grep/head/tail)
      are exposed on PATH so the config works inside pwsh.
   3. Auto-installs missing LSP servers invoked directly by the config
      (bash-language-server, yaml-language-server) — respecting
      pacman/AUR (yay|paru) on Arch, npm -g elsewhere.
      Other LSPs (vtsls, docker, vscode-*) run via npx -y (zero-install).
   4. If target dir has existing config with foreign files, prompts for
      confirmation (or --force). Re-running with only our files relinks silently.
   5. Copies config files to ~/.config/opencode.

  With --clean, removes everything without reinstalling:
  - Config files (opencode.jsonc, skills/, commands/, docs/, AGENTS.md)
  - Plugin runtime files (opencode-mem.jsonc, dcp.jsonc, smart-title.jsonc)
  - Plugin system files (package.json, package-lock.json, node_modules/)
  To reinstall after cleaning, run the command without --clean.
`);
}

async function promptUser(question) {
  try {
    const readline = await import("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(/^(y|yes|s|sim)$/i.test(answer.trim()));
      });
    });
  } catch {
    return true; // fallback to --force behavior if readline unavailable
  }
}

async function main() {
  const args = process.argv.slice(2);
  console.log(`==> EitaTI OpenCode config installer v${VERSION}`);
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
      // On Arch, a stale/out-of-sync DB can make a perfectly valid package
      // fail to resolve/verify — refresh once before attempting installs.
      if (isArchBased()) refreshPacman();
      await autoInstall(core);
      refreshPath();
      if (isWin) {
        refreshWindowsPath();
        configureWindowsGit();
      }

      // Re-check after install
      const stillMissing = PREREQS_CORE.filter((p) => !which(p.name));
      if (stillMissing.length) {
        console.error("\n  Install manually, then re-run:");
        for (const p of stillMissing) console.error(`    ${p.name} — ${p.note}`);
        if (isArchBased()) console.error("    Arch: sudo pacman -S python-ruff");
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

  // LSPs invoked directly by opencode.jsonc — auto-install if missing.
  const lsps = checkLSPs();
  if (lsps.length) {
    if (dry) {
      warn("dry-run: missing LSP servers (would be installed):");
      for (const p of lsps) warn(`  ${p.name} not found`);
    } else if (noAutoInstall) {
      printPrerequisiteHelp(lsps, "LSP servers");
      console.log("\nInstall the LSP servers above, then re-run the command.\n");
    } else {
      log(`Installing LSP servers: ${lsps.map((p) => p.name).join(", ")}`);
      await autoInstall(lsps);
      const stillMissing = LSP_SERVERS.filter((p) => !which(p.name));
      if (stillMissing.length) {
        console.log("\n  Install manually, then re-run:");
        for (const p of stillMissing) console.log(`    ${p.name} — ${p.note}`);
        if (isArchBased()) console.log("    Arch: sudo pacman -S bash-language-server yaml-language-server");
      }
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
    if (hasForeignFiles(target)) {
      warn(`Target directory has config plus other files: ${target}`);
      const answer = await promptUser("Overwrite existing config? (y/N) ");
      if (!answer) {
        console.log("Aborted. Use --force to overwrite without prompting.");
        process.exit(0);
      }
      backupTarget(target);
    } else {
      // Idempotent re-run: relink silently, no prompt needed.
    }
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
