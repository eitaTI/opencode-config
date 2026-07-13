# Plugins

Instalados pelo OpenCode via **Bun** (runner único). Cada plugin abaixo é uma
entrada no array `"plugin"` do `opencode.jsonc`.

## Ativos

| Plugin | Estrelas | Propósito | Motivação | Config extra |
|--------|----------|-----------|-----------|--------------|
| `opencode-shell-strategy` | ★113 | Ensina o LLM a usar flags não-interativas no shell (sem TTY/PTY) | Evita comandos que travam ou abrem prompts interativos | nenhuma |
| `opencode-notify` | — | Pop-ups do sistema com botões acionáveis | Avisa ao concluir/erro/permissão sem ficar babando terminal | backend de notificação do SO (no Linux pode não haver backend) |
| `opencode-websearch-cited` | — | Web search com citações (injeta MCP `websearch`/Exa) | Fontes rastreáveis em respostas | nenhuma (remoto) |
| `opencode-dynamic-context-pruning` | ★3.693 | Poda dinâmica do contexto da conversa | Otimiza uso de tokens em sessões longas | nenhuma |
| `opencode-mem` | ★1.078 | Memória persistente local (SQLite + índice vetorial, embeddings locais) | Lembra o projeto e o usuário entre sessões, **sem API key** | `search`/`add`/`list` funcionam sem provedor; auto-captura precisa de modelo com tool-calls. Gera `opencode-mem.jsonc` (não versionar) |
| `oh-my-opencode-slim` | ★6.855 | Orquestrador multi-agente (shadow agents + auto-delegação) | Único orquestrador do repo — evita empilhar frameworks | Materializado pelo `install.sh` via `bunx oh-my-opencode-slim@latest install` (idempotente) |

## Notas

- **Um só orquestrador de propósito.** `oh-my-opencode-slim` injeta os agentes
  (explorer, librarian, oracle, designer, fixer, etc.) e o prompt de
  orquestração. Não adicione outro framework de agentes — cada um adiciona
  dezenas de ferramentas ao contexto.
- **Memória:** `opencode-mem` é local-first; nada sai da máquina. Sem
  `supermemory`/contas — respeita a regra de "sem credenciais".
- **Ordem de carga:** os plugins são locais (scope `local`), lidos do
  `opencode.jsonc` deste repo.
