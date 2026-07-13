# EitaTI — OpenCode Global Config

Configuração global do [OpenCode](https://opencode.ai) da EitaTI, versionada em
git para facilitar novas instalações. Basta clonar e rodar o instalador.

## O que está incluído

- **LSP** habilitado (auto-instala `typescript`/`eslint`/`oxlint` e `pyright`
  conforme os arquivos abertos) + `ruff server` para Python.
- **Formatters** (Prettier para TS/JS; ruff cuida do Python).
- **MCP servers** (ver `opencode.jsonc`):
  - Sem credencial (ativos): `context7`, `gh_grep`, `fetch`,
    `sequentialthinking`, `git` (via `@cyanheads/git-mcp-server`).
  - Pesados/opcionais (desativados): `chrome-devtools`, `playwright`.
  - Com API key (desativado): `brave-search` (precisa de `BRAVE_API_KEY`).
  - **Todos** rodam via `bunx` (Bun) — um único runner portátil.
- **Plugins** (instalados pelo OpenCode via Bun):
  `opencode-shell-strategy`, `opencode-notify`, `opencode-websearch-cited`,
  `opencode-dynamic-context-pruning`, `opencode-mem` (memória local, sem
  credenciais) e `oh-my-opencode-slim` (orquestrador multi-agente).
- **Skills** globais em `skills/` (`git-release`, `conventional-commits`,
  `explain-code`, `agent-orchestration`).

## Pré-requisitos

- **Bun** (instalado automaticamente pelo `install.sh` se ausente). É o
  runner único para MCP servers e plugins.
- **ruff** (LSP de Python + formatter): instalado pelo `install.sh` via
  installer standalone (`curl -LsSf https://astral.sh/ruff/install.sh | sh`).
  É um binário direto (Rust), não um package-runner — por isso não roda via
  `bunx`. Nenhum `uv`/`pip` é necessário.
- Google Chrome (somente se for usar `chrome-devtools`).
- OpenCode: `opencode mcp list` / `opencode debug config` para verificar.

## Instalação

```bash
git clone <repo-url> opencode-config
cd opencode-config
bash install.sh
```

`install.sh`:
1. Instala o **Bun** caso não esteja presente.
2. Cria symlinks de `opencode.jsonc` e `skills/` em `~/.config/opencode`.
3. Materializa os agentes/comandos do `oh-my-opencode-slim`
   (`bunx oh-my-opencode-slim@latest install`, idempotente).

Ou manualmente:

```bash
ln -sf "$PWD/opencode.jsonc" ~/.config/opencode/opencode.jsonc
ln -sfn "$PWD/skills"          ~/.config/opencode/skills
bunx oh-my-opencode-slim@latest install
```

## Memória (opencode-mem)

Memória local, sem API key: banco SQLite + índice vetorial com embeddings
locais. `search`/`add`/`list` funcionam sem provedor; a auto-captura de
memórias precisa de um modelo que retorne tool-calls estruturados.

## Ativando servidores opcionais

Edite `opencode.jsonc` e troque `"enabled": false` por `true` em
`chrome-devtools`, `playwright` ou `brave-search`. Para o Brave, exporte
`BRAVE_API_KEY` (ou use `BRAVE_API_KEY_FILE`).

## Notas

- MCPs adicionam ferramentas ao contexto; mantenha só os necessários por projeto.
- LSP pode usar memória em projetos grandes — desative por servidor se precisar.
- **Runner padronizado:** tudo via `bunx` (Bun). Evite misturar `npx`/`uvx`.
- Um único orquestrador (`oh-my-opencode-slim`) de propósito — não empilhe
  frameworks de agentes, pois cada um adiciona muitas ferramentas ao contexto.
