# LSP (Language Server Protocol)

O OpenCode auto-instala LSPs built-in conforme os arquivos abertos
(`typescript`, `eslint`, `oxlint`). Os servidores abaixo são configurados
manualmente. Todos os servidores locais rodam via **`npx -y`** (Node.js) —
runner único e portátil. Nenhuma configuração extra é exigida, salvo a
instalação do binário `ruff` (ver abaixo).

Regra geral: LSPs consomem memória em projetos grandes; desative por
servidor se precisar (ex.: `"pyright": { "disabled": true }`).

## Built-ins (automáticos)

| LSP | Linguagem | Motivação | Config extra |
|-----|-----------|-----------|--------------|
| `typescript` | TS/JS | Diagnósticos e lint em tempo real | nenhuma |
| `oxlint` | TS/JS | Lint rápido (Rust) | nenhuma |
| `eslint` | TS/JS | **desativado** — substituído por `eslint-lsp` (abaixo) | — |

> `pyright` (built-in) também está **desativado** — veja `basedpyright`.

## ESLint LSP (substitui o built-in `eslint`)

### `eslint-lsp` (via `vscode-eslint-language-server`)
- **Comando:** `npx -y vscode-langservers-extracted vscode-eslint-language-server --stdio`
- **Escopo:** `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`.
- **Motivação:** Language Server oficial do ESLint (extraído da extensão
  VS Code) — diagnósticos + code actions. O `eslint` built-in é
  desativado para evitar diagnósticos duplicados.
- **Config extra:** nenhuma — instalado sob demanda pelo `npx`.

## Python

### `ruff server` (já existente)
- **Comando:** `ruff server` (binário Rust standalone).
- **Escopo:** `.py`, `.pyi`.
- **Motivação:** lint + formatação rápida de Python, complementando o
  type-check. O formatter do OpenCode também usa o ruff para Python.
- **Config extra:** o binário `ruff` precisa estar no `PATH` (instalado pelo
  `install.sh` via installer standalone). A Astral não publica o ruff no npm,
  então ele **não** roda via `npx` — é um binário direto.

### `basedpyright` (substitui o pyright built-in)
- **Comando:** `npx -y basedpyright basedpyright-langserver --stdio`
- **Escopo:** `.py`, `.pyi`.
- **Motivação:** fork comunitário **mais rígido** do pyright (mais checagens
  de tipo, `report*` extras). Roda 100% em Node via `npx` (sem Python).
  O `pyright` built-in é desativado para evitar diagnósticos duplicados.
- **Config extra:** nenhuma — instalado sob demanda pelo `npx`.

## TypeScript/JavaScript

### `vtsls`
- **Comando:** `vtsls --stdio`
- **Escopo:** `.ts`, `.tsx`, `.js`, `.jsx`.
- **Motivação:** Language Server TypeScript completo (alternativa ao
  `typescript-language-server` built-in). Suporte a code actions, refs, etc.
- **Config extra:** requer `vtsls` instalado globalmente.

## Web / CSS

### `tailwindcss-language-server`
- **Comando:** `npx -y @tailwindcss/language-server --stdio`
- **Escopo:** `.css`, `.scss`.
- **Motivação:** inteligência de classes Tailwind (autocomplete, lint de
  classes inexistentes). Só ativa em arquivos CSS — sem conflito com os
  LSPs de TS/JS.
- **Config extra:** nenhuma.

### `emmet-language-server`
- **Comando:** `npx -y emmet-language-server --stdio`
- **Escopo:** `.html`, `.css`, `.scss`.
- **Motivação:** abreviações Emmet em HTML/CSS (expansão rápida de
  markup). Só ativa nesses tipos de arquivo.
- **Config extra:** nenhuma.

### `vscode-html-language-server`
- **Comando:** `vscode-html-language-server --stdio`
- **Escopo:** `.html`, `.htm`.
- **Motivação:** Language Server HTML completo (autocompletar, validação).
- **Config extra:** requer `vscode-langservers-extracted` instalado.

### `vscode-css-language-server`
- **Comando:** `vscode-css-language-server --stdio`
- **Escopo:** `.css`, `.scss`, `.less`.
- **Motivação:** Language Server CSS/SCSS/LESS completo.
- **Config extra:** requer `vscode-langservers-extracted` instalado.

## Infra/DevOps

### `bash-language-server`
- **Comando:** `bash-language-server start`
- **Escopo:** `.sh`, `.bash`.
- **Motivação:** Language Server para scripts Bash/Shell (diagnósticos, completar).
- **Config extra:** requer `bash-language-server` instalado.

### `docker-langserver`
- **Comando:** `docker-langserver --stdio`
- **Escopo:** `Dockerfile`, `.dockerfile`.
- **Motivação:** Language Server para Dockerfiles.
- **Config extra:** requer `docker-langserver` instalado.

### `yaml-language-server`
- **Comando:** `yaml-language-server --stdio`
- **Escopo:** `.yaml`, `.yml`.
- **Motivação:** Language Server para YAML (validação, autocomplete).
- **Config extra:** requer `yaml-language-server` instalado.

## Dados

### `vscode-json-language-server`
- **Comando:** `vscode-json-language-server --stdio`
- **Escopo:** `.json`, `.jsonc`.
- **Motivação:** Language Server para JSON/JSONC (validação, autocomplete).
- **Config extra:** requer `vscode-langservers-extracted` instalado.

### `vscode-markdown-language-server`
- **Comando:** `vscode-markdown-language-server --stdio`
- **Escopo:** `.md`, `.markdown`.
- **Motivação:** Language Server para Markdown (links, headings).
- **Config extra:** requer `vscode-langservers-extracted` instalado.

## Formatação

- **TS/JS:** Prettier (nativo do OpenCode, `"formatter": true`).
- **Python:** ruff (via LSP acima).
