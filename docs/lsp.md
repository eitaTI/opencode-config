# LSP (Language Server Protocol)

O OpenCode auto-instala LSPs built-in conforme os arquivos abertos
(`typescript`, `eslint`, `oxlint`). Os servidores abaixo são configurados
manualmente.

Regra geral: LSPs consomem memória em projetos grandes; desative por
servidor se precisar (ex.: `"pyright": { "disabled": true }`).

## Instalação por sistema operacional

O instalador (`bin/install.mjs` / `install.sh`) **auto-instala** os LSPs
invocados *diretamente* no `opencode.jsonc` (abaixo). Os que rodam via
`npx -y` — **basedpyright**, **eslint-lsp**, **tailwindcss** e
**emmet** (`@olrtg/emmet-language-server`) — **não** precisam de instalação:
o `npx` baixa sob demanda.

> **Arch / CachyOS:** use **sempre** `pacman` / `yay` / `paru`.
> **Nunca** `sudo npm install -g` — escreve fora do controle do pacman e
> quebra atualizações do sistema.

### Arch Linux / CachyOS
```bash
# Pacman (repositório [extra])
sudo pacman -S bash-language-server yaml-language-server

# AUR (precisa de yay ou paru) — cobre json/html/css/markdown de uma vez
yay -S vtsls vscode-langservers-extracted docker-language-server
```

### Ubuntu / Debian (e demais distros não-Arch)
```bash
npm i -g vtsls bash-language-server yaml-language-server \
  vscode-langservers-extracted dockerfile-language-server-nodejs
# vscode-langservers-extracted cobre json/html/css/markdown de uma vez
```

### Windows
```powershell
npm i -g vtsls bash-language-server yaml-language-server `
  vscode-langservers-extracted dockerfile-language-server-nodejs
```

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
- **Instalação:**
  - **Arch/CachyOS:** `sudo pacman -S python-ruff` (repositório oficial [extra]); se o pacman falhar, o helper AUR (yay|paru) é usado.
  - **Outras distros:** `curl -LsSf https://astral.sh/ruff/install.sh | sh`
    (binário standalone — a Astral não publica o ruff no npm).

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
- **Instalação:**
  - **Arch/CachyOS:** `yay -S vtsls` (AUR).
  - **Outras distros:** `npm i -g @vtsls/language-server`.

## Web / CSS

### `tailwindcss-language-server`
- **Comando:** `npx -y @tailwindcss/language-server --stdio`
- **Escopo:** `.css`, `.scss`.
- **Motivação:** inteligência de classes Tailwind (autocomplete, lint de
  classes inexistentes). Só ativa em arquivos CSS — sem conflito com os
  LSPs de TS/JS.
- **Config extra:** nenhuma.

### `emmet-language-server`
- **Comando:** `npx -y @olrtg/emmet-language-server --stdio`
- **Escopo:** `.html`, `.css`, `.scss`.
- **Motivação:** abreviações Emmet em HTML/CSS (expansão rápida de
  markup). Só ativa nesses tipos de arquivo.
- **Instalação:** roda via `npx -y @olrtg/emmet-language-server` (pacote
  mantido) — **sem instalação manual**. Alternativa global:
  `npm i -g @olrtg/emmet-language-server`.

### `vscode-html-language-server`
- **Comando:** `vscode-html-language-server --stdio`
- **Escopo:** `.html`, `.htm`.
- **Motivação:** Language Server HTML completo (autocompletar, validação).
- **Instalação:**
  - **Arch/CachyOS:** `sudo pacman -S vscode-html-languageserver` (repositório oficial [extra]).
  - **Outras distros:** `npm i -g vscode-langservers-extracted`.

### `vscode-css-language-server`
- **Comando:** `vscode-css-language-server --stdio`
- **Escopo:** `.css`, `.scss`, `.less`.
- **Motivação:** Language Server CSS/SCSS/LESS completo.
- **Instalação:**
  - **Arch/CachyOS:** `sudo pacman -S vscode-css-languageserver` (repositório oficial [extra]).
  - **Outras distros:** `npm i -g vscode-langservers-extracted`.

## Infra/DevOps

### `bash-language-server`
- **Comando:** `bash-language-server start`
- **Escopo:** `.sh`, `.bash`.
- **Motivação:** Language Server para scripts Bash/Shell (diagnósticos, completar).
- **Instalação:**
  - **Arch/CachyOS:** `sudo pacman -S bash-language-server` (repositório oficial [extra]).
  - **Outras distros:** `npm i -g bash-language-server`.

### `docker-langserver`
- **Comando:** `docker-langserver --stdio`
- **Escopo:** `Dockerfile`, `.dockerfile`.
- **Motivação:** Language Server para Dockerfiles.
- **Instalação:**
  - **Arch/CachyOS:** `yay -S docker-language-server` (AUR — fornece o binário `docker-langserver`).
  - **Outras distros:** `npm i -g dockerfile-language-server-nodejs`.

### `yaml-language-server`
- **Comando:** `yaml-language-server --stdio`
- **Escopo:** `.yaml`, `.yml`.
- **Motivação:** Language Server para YAML (validação, autocomplete).
- **Instalação:**
  - **Arch/CachyOS:** `sudo pacman -S yaml-language-server` (repositório oficial [extra]).
  - **Outras distros:** `npm i -g yaml-language-server`.

## Dados

### `vscode-json-language-server`
- **Comando:** `vscode-json-language-server --stdio`
- **Escopo:** `.json`, `.jsonc`.
- **Motivação:** Language Server para JSON/JSONC (validação, autocomplete).
- **Instalação:**
  - **Arch/CachyOS:** `sudo pacman -S vscode-json-languageserver` (repositório oficial [extra]).
  - **Outras distros:** `npm i -g vscode-langservers-extracted`.

### `vscode-markdown-language-server`
- **Comando:** `vscode-markdown-language-server --stdio`
- **Escopo:** `.md`, `.markdown`.
- **Motivação:** Language Server para Markdown (links, headings).
- **Instalação:** vem do pacote `vscode-langservers-extracted` (junto com
  json/html/css).
  - **Arch/CachyOS:** `yay -S vscode-langservers-extracted` (AUR).
  - **Outras distros:** `npm i -g vscode-langservers-extracted`.

## Formatação

- **TS/JS:** Prettier (nativo do OpenCode, `"formatter": true`).
- **Python:** ruff (via LSP acima).
