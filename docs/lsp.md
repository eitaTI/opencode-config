# LSP (Language Server Protocol)

O OpenCode auto-instala LSPs built-in conforme os arquivos abertos
(`typescript`, `eslint`, `oxlint`). Os servidores abaixo são configurados
manualmente. Todos os servidores locais rodam via **`bunx`** (Bun) —
runner único e portátil. Nenhuma configuração extra é exigida, salvo a
instalação do binário `ruff` (ver abaixo).

Regra geral: LSPs consomem memória em projetos grandes; desative por
servidor se precisar (ex.: `"pyright": { "disabled": true }`).

## Built-ins (automáticos)

| LSP | Linguagem | Motivação | Config extra |
|-----|-----------|-----------|--------------|
| `typescript` / `eslint` / `oxlint` | TS/JS | Diagnósticos e lint em tempo real | nenhuma |

> `pyright` (built-in) está **desativado** neste repo — veja `basedpyright`.

## Python

### `ruff server` (já existente)
- **Comando:** `ruff server` (binário Rust standalone).
- **Escopo:** `.py`, `.pyi`.
- **Motivação:** lint + formatação rápida de Python, complementando o
  type-check. O formatter do OpenCode também usa o ruff para Python.
- **Config extra:** o binário `ruff` precisa estar no `PATH` (instalado pelo
  `install.sh` via installer standalone). A Astral não publica o ruff no npm,
  então ele **não** roda via `bunx` — é um binário direto.

### `basedpyright` (substitui o pyright built-in)
- **Comando:** `bunx -p basedpyright basedpyright-langserver --stdio`
- **Escopo:** `.py`, `.pyi`.
- **Motivação:** fork comunitário **mais rígido** do pyright (mais checagens
  de tipo, `report*` extras). Roda 100% em Node via `bunx` (sem Python).
  O `pyright` built-in é desativado para evitar diagnósticos duplicados.
- **Config extra:** nenhuma — instalado sob demanda pelo `bunx`.

## Web / CSS (TypeScript)

### `tailwindcss-language-server`
- **Comando:** `bunx @tailwindcss/language-server --stdio`
- **Escopo:** `.css`, `.scss`.
- **Motivação:** inteligência de classes Tailwind (autocomplete, lint de
  classes inexistentes). Só ativa em arquivos CSS — sem conflito com os
  LSPs de TS/JS.
- **Config extra:** nenhuma.

### `emmet-language-server`
- **Comando:** `bunx emmet-language-server --stdio`
- **Escopo:** `.html`, `.css`, `.scss`.
- **Motivação:** abreviações Emmet em HTML/CSS (expansão rápida de
  markup). Só ativa nesses tipos de arquivo.
- **Config extra:** nenhuma.

## Formatação

- **TS/JS:** Prettier (nativo do OpenCode, `"formatter": true`).
- **Python:** ruff (via LSP acima).

## Opcional (não ativo por padrão)

### `biome` (TS/JS) — alternativa ao eslint/oxlint + prettier
- **Comando:** `bunx @biomejs/biome lsp-proxy`
- **Motivação:** formatter + linter rápido, nativo de Bun.
- **Atenção:** conflita com os LSPs built-in (`eslint`/`oxlint`) e com o
  formatter Prettier (diagnósticos duplicados). Para usá-lo, desative os
  built-ins: `"typescript": { "disabled": true }` e configure o formatter
  custom para o Biome. Deixado desativado de propósito neste repo.
