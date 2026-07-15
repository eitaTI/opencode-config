# EitaTI — OpenCode Global Config

Configuração global do [OpenCode](https://opencode.ai) da EitaTI, versionada em
git para facilitar novas instalações. Clone, rode o instalador e pronto.

Tudo roda via **`npx`** (Node.js) como runner principal — o `fetch` usa `uvx` para o servidor Python oficial.

## Instalação rápida (um comando, cross-platform)

Windows, macOS ou Linux — sem clonar, sem instalar nada antes:

```bash
npx -y github:EitaTI/opencode-config
```

> **Windows:** se `npx` falhar com
> `The term 'node.exe' is not recognized`, é um problema de PATH do
> Node na sessão do PowerShell — não deste projeto. Refresque o PATH
> e reabra o terminal:
> ```powershell
> $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
> ```

Esse comando (1) **auto-instala** pré-requisitos faltantes (Node.js, uv, ruff, rtk),
(2) copia `opencode.jsonc`, `skills/`, `commands/`, `docs/` e `AGENTS.md` para o
diretório global do OpenCode (`~/.config/opencode`), (3) se já existir config, cria backup
antes de sobrescrever. Opções:

```bash
npx github:EitaTI/opencode-config --dry-run          # preview sem alterar nada
npx github:EitaTI/opencode-config --force             # sobrescreve sem perguntar
npx github:EitaTI/opencode-config --clean             # remove tudo (sem reinstalar)
npx github:EitaTI/opencode-config --no-auto-install   # só mostra comandos, não instala
```

## Instalação via clone (dev/contribuição)

> **Nota:** `install.sh` é para **Unix** (Linux/macOS). No Windows, use `bin/install.mjs`.

```bash
git clone <repo-url> opencode-config
cd opencode-config
bash install.sh    # Unix apenas
```

O `install.sh` (idempotente) faz:
1. Detecta a distro (Arch/Debian/Fedora/SUSE) e instala **Node.js** e **ruff** se ausentes.
2. Instala **uv** e **rtk** se ausentes.
3. Cria symlinks de `opencode.jsonc`, `skills/`, `commands/`, `docs/` e `AGENTS.md` em `~/.config/opencode`.

No Windows, use o instalador cross-platform:
```bash
node bin/install.mjs
# ou: npx -y github:EitaTI/opencode-config
```

Verifique: `opencode mcp list` e `opencode debug config`.

## O que está incluído
Detalhes, motivação e configuração extra de cada item estão em `docs/`:

| Categoria | Arquivo | Resumo |
|-----------|----------|---------|
| **LSP** | [docs/lsp.md](docs/lsp.md) | 13 language servers: `basedpyright`, `ruff`, `vtsls`, `eslint-lsp`, `tailwindcss`, `emmet`, `bash`, `docker`, `yaml`, `json`, `html`, `css`, `markdown` |
| **MCP** | [docs/mcp.md](docs/mcp.md) | `context7`, `gh_grep`, `fetch`, `sequentialthinking`, `git`, `sqlite` (ativos); `playwright`/`brave-search` (opcionais) |
| **Plugins** | [docs/plugins.md](docs/plugins.md) | 8 plugins: `opencode-mem`, `@tarquinen/opencode-dcp`, `opencode-wakatime`, `opencode-pty`, `envsitter-guard`, `opencode-smart-title`, `openslimedit`, etc. |

- **Skills** globais em `skills/`: `git-release`, `conventional-commits`,
  `explain-code`, `codemap`, `clonedeps`, `worktrees`, `simplify`.

- **Comandos** customizados em `commands/`: `/review`, `/test`, `/fix`, `/explain`, `/clean`, `/commit`.

## Pré-requisitos

O instalador **auto-instala** pré-requisitos faltantes. **Node.js**, **uv** e
**ruff** são obrigatórios — o instalador instala automaticamente se ausentes.
**rtk** é opcional (recomendado) — também é instalado automaticamente.

Use `--no-auto-install` para ver os comandos sem executar:

### Pop!_OS / Ubuntu / Debian

```bash
# Node.js LTS (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# uv (Python MCP server)
curl -LsSf https://astral.sh/uv/install.sh | sh

# ruff (Python LSP + formatter)
curl -LsSf https://astral.sh/ruff/install.sh | sh

# rtk (Rust Token Killer — optional, reduces LLM token consumption by 60-90%)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
```

### CachyOS / Arch Linux / EndeavourOS

O `install.sh` detecta automaticamente distros baseadas em Arch (pacman),
Debian/Ubuntu (apt-get), Fedora (dnf) e SUSE (zypper).

```bash
# Instalação via clone
git clone <repo-url> opencode-config
cd opencode-config
bash install.sh
```

Ou use o instalador cross-platform:
```bash
npx -y github:EitaTI/opencode-config
```

### Windows

```powershell
# Node.js LTS
powershell -c "winget install OpenJS.NodeJS.LTS"

# uv
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# ruff
powershell -c "irm https://astral.sh/ruff/install.ps1 | iex"

# rtk (optional — Rust Token Killer)
# Download from: https://github.com/rtk-ai/rtk/releases/latest
# Extract rtk-x86_64-pc-windows-msvc.zip to a directory in your PATH
```

### macOS

```bash
# Node.js LTS (via Homebrew)
brew install node

# uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# ruff
curl -LsSf https://astral.sh/ruff/install.sh | sh

# rtk (optional — Rust Token Killer)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
```

- **`BRAVE_API_KEY`** — só se for ativar `brave-search`.

## Estrutura

```
opencode.jsonc          # config principal (LSP, MCP, plugins, permissões)
install.sh              # instalador idempotente
bin/install.mjs         # instalador cross-platform (Node.js)
skills/                 # skills globais
commands/               # comandos customizados (/review, /test, etc.)
docs/                   # lsp.md · mcp.md · plugins.md
```

## Permissões

O `opencode.jsonc` inclui permissões granulares pré-configuradas:
- **Auto-approve** para operações seguras: leitura, escrita, git read-only
- **Ask** para comandos destrutivos: `rm`, `git push`, `git commit`, `npm install`
- **Wildcard** para bash: comandos seguros como `git status`, `ls`, `grep` são auto-aprovados

Edite as regras de permissão no `opencode.jsonc` conforme seu fluxo de trabalho.

## Notas

- **Runner padronizado:** tudo via `npx` (Node.js). O único binário fora desse
  padrão é o `ruff` (Rust, sem pacote npm — roda direto, não via `npx`).
- **Memória sem credenciais:** `opencode-mem` é local (SQLite + embeddings
  locais); nada sai da máquina.
- MCPs e LSPs consomem contexto/tokens — mantenha ativos só os necessários
  por projeto.
