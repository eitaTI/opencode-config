# EitaTI — OpenCode Global Config

Configuração global do [OpenCode](https://opencode.ai) da EitaTI, versionada em
git para facilitar novas instalações. Clone, rode o instalador e pronto.

Tudo roda via **`npx`** (Node.js) como runner principal — o `fetch` usa `uvx` para o servidor Python oficial.

## Instalação rápida (um comando, cross-platform)

Windows, macOS ou Linux — sem clonar, sem instalar nada antes:

```bash
npx github:EitaTI/opencode-config
```

> **Windows + `npx`:** se `npx` falhar com
> `The term 'node.exe' is not recognized`, é um problema de PATH do
> Node na sessão do PowerShell — não deste projeto. Refresque o PATH
> e reabra o terminal:
> ```powershell
> $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
> ```

Esse comando (1) copia `opencode.jsonc`, `skills/` e `docs/` para o
diretório global do OpenCode, (2) confere os pré-requisitos **Node.js**, **uv** e
**ruff** (mostra o comando de instalação de cada um se faltar) e (3)
materializa o orquestrador `oh-my-openagent` e habilita a flag
experimental de LSP tool. Para ver o que seria feito sem alterar nada:
`npx github:EitaTI/opencode-config --dry-run`.

## Instalação via clone (dev/contribuição)

```bash
git clone <repo-url> opencode-config
cd opencode-config
bash install.sh
```

O `install.sh` (idempotente) faz:
1. Instala o **Node.js** e o **ruff** (binário standalone) se ausentes.
2. Cria symlinks de `opencode.jsonc` e `skills/` em `~/.config/opencode`.
3. Materializa os agentes do `oh-my-openagent`
   (`npx oh-my-openagent@latest install`).

Verifique: `opencode mcp list` e `opencode debug config`.

## O que está incluído
Detalhes, motivação e configuração extra de cada item estão em `docs/`:

| Categoria | Arquivo | Resumo |
|-----------|----------|---------|
| **LSP** | [docs/lsp.md](docs/lsp.md) | 19 language servers: `basedpyright`, `ruff`, `vtsls`, `eslint-lsp`, `tailwindcss`, `emmet`, `bash`, `docker`, `yaml`, `json`, `html`, `css`, `markdown`, `ansible` |
| **MCP** | [docs/mcp.md](docs/mcp.md) | `context7`, `gh_grep`, `fetch`, `sequentialthinking`, `git`, `filesystem`, `memory`, `sqlite` (ativos); `playwright`/`brave-search` (opcionais) |
| **Plugins** | [docs/plugins.md](docs/plugins.md) | 10 plugins: `oh-my-openagent`, `opencode-mem`, `opencode-notify`, `@tarquinen/opencode-dcp`, `opencode-wakatime`, `opencode-pty`, `opencode-snip`, `envsitter-guard`, `opencode-smart-title`, etc. |

- **Skills** globais em `skills/`: `git-release`, `conventional-commits`,
  `explain-code`, `agent-orchestration`, `oh-my-openagent`, `codemap`,
  `clonedeps`, `deepwork`, `reflect`, `worktrees`, `release-smoke-test`.

## Pré-requisitos

O instalador **não** instala essas ferramentas — ele confere se estão
presentes e, se faltar alguma, mostra o comando de instalação e pede
para você instalar e rodar de novo.

- **Node.js** — runner para os MCP servers via `npx` + `oh-my-openagent`.
  Windows: `powershell -c "winget install OpenJS.NodeJS.LTS"`
  macOS/Linux: `curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **uv** — roda o servidor MCP `fetch` (Python oficial) via `uvx`.
  Windows: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
  macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **ruff** — LSP/formatter Python usado pela config.
  Windows: `powershell -c "irm https://astral.sh/ruff/install.ps1 | iex"`
  macOS/Linux: `curl -LsSf https://astral.sh/ruff/install.sh | sh`
- **`BRAVE_API_KEY`** — só se for ativar `brave-search`.

## Estrutura

```
opencode.jsonc          # config principal (LSP, MCP, plugins, skills)
install.sh              # instalador idempotente
bin/install.mjs         # instalador cross-platform (Node.js)
skills/                 # skills globais
docs/                   # lsp.md · mcp.md · plugins.md
```

## Notas

- **Runner padronizado:** tudo via `npx` (Node.js). O único binário fora desse
  padrão é o `ruff` (Rust, sem pacote npm — roda direto, não via `npx`).
- **Um só orquestrador:** `oh-my-openagent`. Não empilhe frameworks de
  agentes — cada um adiciona muitas ferramentas ao contexto.
- **Memória sem credenciais:** `opencode-mem` é local (SQLite + embeddings
  locais); nada sai da máquina.
- MCPs e LSPs consomem contexto/tokens — mantenha ativos só os necessários
  por projeto.
