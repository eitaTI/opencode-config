# EitaTI — OpenCode Global Config

Configuração global do [OpenCode](https://opencode.ai) da EitaTI, versionada em
git para facilitar novas instalações. Clone, rode o instalador e pronto.

Tudo roda via **Bun** (`bunx`) como runner único — sem `npx`/`uvx`/`pip`.

## Instalação rápida (um comando, cross-platform)

Windows, macOS ou Linux — sem clonar, sem instalar nada antes:

```bash
npx github:EitaTI/opencode-config
# ou, se preferir Bun:
bunx github:EitaTI/opencode-config
```

Esse comando (1) copia `opencode.jsonc`, `skills/` e `docs/` para o
diretório global do OpenCode, (2) instala **Bun** + **ruff** se ausentes,
(3) materializa o orquestrador `oh-my-opencode-slim` e (4) habilita a flag
experimental de LSP tool. Para ver o que seria feito sem alterar nada:
`npx github:EitaTI/opencode-config --dry-run`.

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

- **Bun** — instalado automaticamente pelo `install.sh`. Runner único.
- **ruff** — binário Rust instalado pelo `install.sh` (sem `uv`/`pip`).
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
