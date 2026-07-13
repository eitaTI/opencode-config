# EitaTI — OpenCode Global Config

Configuração global do [OpenCode](https://opencode.ai) da EitaTI, versionada em
git para facilitar novas instalações. Clone, rode o instalador e pronto.

Tudo roda via **Bun** (`bunx`) como runner principal — o `fetch` usa `uvx` para o servidor Python oficial; sem `npm`/`pip`.

## Instalação rápida (um comando, cross-platform)

Windows, macOS ou Linux — sem clonar, sem instalar nada antes:

```bash
bunx github:EitaTI/opencode-config
# alternativa (precisa de Node.js/npm no PATH):
npx github:EitaTI/opencode-config
```

> **Windows + `npx`:** se `npx` falhar com
> `The term 'node.exe' is not recognized`, é um problema de PATH do
> Node na sessão do PowerShell — não deste projeto. Use `bunx` (não depende
> de Node/npm) ou refresque o PATH e reabra o terminal:
> ```powershell
> $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
> ```
>
> **Após um update no repo:** o `bunx` cacheia pacotes `github:` por até
> 24h (bug conhecido do Bun, [oven-sh/bun#27379](https://github.com/oven-sh/bun/issues/27379))
> e não re-baixa sozinho após um push. Se rodar o comando e o comportamento
> não mudar, limpe os caches antes de rodar de novo:
> ```powershell
> bun pm cache rm
> Remove-Item -Recurse -Force "$env:TEMP\bunx-*"
> bunx github:EitaTI/opencode-config
> ```

Esse comando (1) copia `opencode.jsonc`, `skills/` e `docs/` para o
diretório global do OpenCode, (2) confere os pré-requisitos **Bun**, **uv** e
**ruff** (mostra o comando de instalação de cada um se faltar) e (3)
materializa o orquestrador `oh-my-opencode-slim` e habilita a flag
experimental de LSP tool. Para ver o que seria feito sem alterar nada:
`bunx github:EitaTI/opencode-config --dry-run`.

## Instalação via clone (dev/contribuição)

```bash
git clone <repo-url> opencode-config
cd opencode-config
bash install.sh
```

O `install.sh` (idempotente) faz:
1. Instala o **Bun** e o **ruff** (binário standalone) se ausentes.
2. Cria symlinks de `opencode.jsonc` e `skills/` em `~/.config/opencode`.
3. Materializa os agentes do `oh-my-opencode-slim`
   (`bunx oh-my-opencode-slim@latest install`).

Verifique: `opencode mcp list` e `opencode debug config`.

## O que está incluído
Detalhes, motivação e configuração extra de cada item estão em `docs/`:

| Categoria | Arquivo | Resumo |
|-----------|----------|---------|
| **LSP** | [docs/lsp.md](docs/lsp.md) | Built-ins (typescript/oxlint) + `basedpyright`, `ruff server`, `eslint-lsp`, `tailwindcss`, `emmet` — tudo via `bunx` |
| **MCP** | [docs/mcp.md](docs/mcp.md) | `context7`, `gh_grep`, `fetch`, `sequentialthinking`, `git`, **`sqlite`** (ativos, sem cred); `playwright`/`brave-search` (opcionais) |
| **Plugins** | [docs/plugins.md](docs/plugins.md) | `opencode-shell-strategy`, `opencode-notify`, `opencode-websearch-cited`, `opencode-dynamic-context-pruning`, `opencode-mem` (memória local), `oh-my-opencode-slim` (orquestrador) |

- **Skills** globais em `skills/`: `git-release`, `conventional-commits`,
  `explain-code`, `agent-orchestration`.

## Pré-requisitos

O instalador **não** instala essas ferramentas — ele confere se estão
presentes e, se faltar alguma, mostra o comando de instalação e pede
para você instalar e rodar de novo.

- **Bun** — runner para os MCP servers via `bunx` + `oh-my-opencode-slim`.
  Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`
  macOS/Linux: `curl -fsSL https://bun.sh/install | bash`
- **uv** — roda o servidor MCP `fetch` (Python oficial) via `uvx`.
  Windows: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
  macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **ruff** — LSP/formatter Python usado pela config.
  Windows: `powershell -c "irm https://astral.sh/ruff/install.ps1 | iex"`
  macOS/Linux: `curl -LsSf https://astral.sh/ruff/install.sh | sh`
- **Node.js** — só necessário se você usar `npx` (o `bunx` não depende
  dele). O `npx` é um script Node e quebra se o `node.exe` não estiver
  no PATH da sessão.
- **`BRAVE_API_KEY`** — só se for ativar `brave-search`.

## Estrutura

```
opencode.jsonc          # config principal (LSP, MCP, plugins, skills)
install.sh              # instalador idempotente
skills/                 # skills globais
docs/                   # lsp.md · mcp.md · plugins.md
```

## Notas

- **Runner padronizado:** tudo via `bunx` (Bun). O único binário fora desse
  padrão é o `ruff` (Rust, sem pacote npm — roda direto, não via `bunx`).
- **Um só orquestrador:** `oh-my-opencode-slim`. Não empilhe frameworks de
  agentes — cada um adiciona muitas ferramentas ao contexto.
- **Memória sem credenciais:** `opencode-mem` é local (SQLite + embeddings
  locais); nada sai da máquina.
- MCPs e LSPs consomem contexto/tokens — mantenha ativos só os necessários
  por projeto.
