# LSP (Language Server Protocol)

O OpenCode auto-instala LSPs built-in conforme os arquivos abertos
(`typescript`, `eslint`, `oxlint`). Os servidores abaixo são configurados
manualmente. Todos os servidores locais rodam via **`npx -y`** (Node.js) —
runner único e portátil. Nenhuma configuração extra é exigida, salvo a
instalação do binário `ruff` (ver abaixo).

Regra geral: LSPs consomem memória em projetos grandes; desative por
servidor se precisar (ex.: `"pyright": { "disabled": true }`).

## Instalação por distro

No **Arch Linux / CachyOS**, prefira sempre `pacman` ou AUR para instalar
LSPs — integrado ao sistema de atualizações e sem binários soltos.

| LSP | pacman (extra) | AUR | npm global |
|-----|:-:|:-:|:-:|
| `ruff` | `sudo pacman -S ruff` | — | — |
| `bash-language-server` | `sudo pacman -S bash-language-server` | — | — |
| `yaml-language-server` | `sudo pacman -S yaml-language-server` | — | — |
| `vscode-json-language-server` | `sudo pacman -S vscode-json-languageserver` | — | — |
| `vscode-html-language-server` | `sudo pacman -S vscode-html-languageserver` | — | — |
| `vscode-css-language-server` | `sudo pacman -S vscode-css-languageserver` | — | — |
| `vtsls` | — | `yay -S vtsls` | `npm i -g @vtsls/language-server` |
| `docker-langserver` | — | `yay -S dockerfile-language-server` | `npm i -g dockerfile-language-server-nodejs` |
| `emmet-language-server` | — | `yay -S emmet-language-server` | `npm i -g @olrtg/emmet-language-server` |

> **Evite `sudo npm install -g`** no Arch — escreve fora do controle do pacman
> e pode causar conflitos em atualizações. Use pacman/AUR sempre que possível.

LSPs executados via **`npx -y`** (basedpyright, eslint-lsp, tailwindcss) não
precisam de instalação manual — o `npx` baixa sob demanda.

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
  - **Arch/CachyOS:** `sudo pacman -S ruff` (repositório oficial [extra]).
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
- **Comando:** `npx -y emmet-language-server --stdio`
- **Escopo:** `.html`, `.css`, `.scss`.
- **Motivação:** abreviações Emmet em HTML/CSS (expansão rápida de
  markup). Só ativa nesses tipos de arquivo.
- **Instalação:** roda via `npx` (sem instalação manual). Alternativa:
  - **Arch/CachyOS:** `yay -S emmet-language-server` (AUR).
  - **Outras distros:** `npm i -g @olrtg/emmet-language-server`.

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
  - **Arch/CachyOS:** `yay -S dockerfile-language-server` (AUR).
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
- **Instalação:**
  - **Outras distros:** `npm i -g vscode-langservers-extracted`.
  - **Arch/CachyOS:** não há pacote oficial no pacman/AUR — use `npx -y`
    (já configurado no opencode.jsonc).

## Formatação

- **TS/JS:** Prettier (nativo do OpenCode, `"formatter": true`).
- **Python:** ruff (via LSP acima).
