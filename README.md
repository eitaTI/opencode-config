# EitaTI — OpenCode Global Config

Configuração global do [OpenCode](https://opencode.ai) da EitaTI, versionada em
git para facilitar novas instalações. Basta clonar e rodar o instalador.

## O que está incluído

- **LSP** habilitado (auto-instala `typescript`/`eslint`/`oxlint` e `pyright`
  conforme os arquivos abertos) + `ruff server` para Python.
- **Formatters** (Prettier para TS/JS; ruff cuida do Python).
- **MCP servers** (ver `opencode.jsonc`):
  - Sem credencial (ativos): `context7`, `gh_grep`, `fetch`, `sequentialthinking`, `git`.
  - Pesados/opcionais (desativados): `chrome-devtools`, `playwright`.
  - Com API key (desativado): `brave-search` (precisa de `BRAVE_API_KEY`).
- **Plugins** (npm, instalados pelo OpenCode via Bun no primeiro lançamento):
  `opencode-shell-strategy`, `opencode-notify`, `opencode-supermemory`,
  `opencode-websearch-cited`, `opencode-dynamic-context-pruning`.
- **Skills** globais em `skills/` (`git-release`, `conventional-commits`, `explain-code`).

## Pré-requisitos

- `node` / `npm` / `npx` (servers Node usam `npx -y`).
- `uv` / `uvx` (server `git` usa `uvx mcp-server-git`).
- `ruff` (para o LSP de Python): `uv tool install ruff`.
- Google Chrome (somente se for usar `chrome-devtools`).
- OpenCode: `opencode mcp list` / `opencode debug config` para verificar.

## Instalação

```bash
git clone <repo-url> opencode-config
cd opencode-config
bash install.sh
```

Ou manualmente:

```bash
ln -sf "$PWD/opencode.jsonc" ~/.config/opencode/opencode.jsonc
ln -sfn "$PWD/skills"          ~/.config/opencode/skills
```

## Ativando servidores opcionais

Edite `opencode.jsonc` e troque `"enabled": false` por `true` em
`chrome-devtools`, `playwright` ou `brave-search`. Para o Brave, exporte
`BRAVE_API_KEY` (ou use `BRAVE_API_KEY_FILE`).

## Notas

- MCPs adicionam ferramentas ao contexto; mantenha só os necessários por projeto.
- LSP pode usar memória em projetos grandes — desative por servidor se precisar.
- Runners: preferimos `npx`/`uvx` a `bun x` por portabilidade (Linux/Windows).
