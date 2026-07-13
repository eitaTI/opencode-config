# LSP (Language Server Protocol)

O OpenCode auto-instala LSPs conforme os arquivos abertos. Além dos
built-ins, adicionamos um LSP customizado para Python.

Todos os LSPs rodam nativamente (sem `bunx`) — são binários que o OpenCode
gerencia. Nenhuma configuração extra é exigida, salvo o `ruff` (ver abaixo).

## Built-ins (automáticos)

| LSP | Linguagem | Motivação | Config extra |
|-----|-----------|-----------|--------------|
| `typescript` / `eslint` / `oxlint` | TS/JS | Diagnósticos e lint em tempo real | nenhuma |
| `pyright` | Python | Type-checking estático | nenhuma |

## Customizado

### `ruff server`
- **Comando:** `ruff server` (binário Rust standalone).
- **Escopo:** arquivos `.py` / `.pyi`.
- **Motivação:** lint + formatação rápida de Python, complementando o
  `pyright` (que só faz type-check). O formatter do OpenCode também usa o
  ruff para Python.
- **Configuração extra:** o binário `ruff` precisa estar no `PATH`. O
  `install.sh` o instala via installer standalone
  (`curl -LsSf https://astral.sh/ruff/install.sh | sh`). **Atenção:** a
  Astral não publica o ruff no npm, então ele **não** roda via `bunx` —
  é um binário direto, não um package-runner.
- **Desativar por servidor:** em projetos grandes o LSP pode consumir memória;
  remova o bloco `"ruff"` do `opencode.jsonc` se necessário.

## Formatação

- **TS/JS:** Prettier (nativo do OpenCode, `"formatter": true`).
- **Python:** ruff (via LSP acima).
