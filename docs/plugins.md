# Plugins

Instalados pelo OpenCode via **npm** (runner único). Cada plugin abaixo é uma
entrada no array `"plugin"` do `opencode.jsonc`.

## Ativos

| Plugin | Propósito | Motivação | Config extra |
|--------|-----------|-----------|--------------|
| `opencode-notify` | Pop-ups do sistema com botões acionáveis | Avisa ao concluir/erro/permissão sem ficar babando terminal | backend de notificação do SO (no Linux pode não haver backend) |
| `opencode-websearch-cited` | Web search com citações (injeta MCP `websearch`/Exa) | Fontes rastreáveis em respostas | nenhuma (remoto) |
| `@tarquinen/opencode-dcp` | Poda dinâmica do contexto da conversa | Otimiza uso de tokens em sessões longas | Configurável via `~/.config/opencode/dcp.jsonc` |
| `opencode-mem` | Memória persistente local (SQLite + índice vetorial, embeddings locais) | Lembra o projeto e o usuário entre sessões, **sem API key** | `search`/`add`/`list` funcionam sem provedor; auto-captura precisa de modelo com tool-calls. Gera `opencode-mem.jsonc` (não versionar) |
| `oh-my-openagent` | Orquestrador multi-agente (11 agentes, Team Mode, ultrawork) | Orquestrador mais completo do repo — evita empilhar frameworks | Materializado pelo `install.sh` via `npx -y oh-my-openagent@latest install` (idempotente) |
| `opencode-wakatime` | Métricas de tempo de programação | Rastreia tempo gasto em cada projeto/file | Requer conta WakaTime + API key |
| `opencode-pty` | Suporte a PTY (pseudo-terminal) | Permite comandos interativos que precisam de TTY | nenhuma |
| `opencode-snip` | Gerenciamento de snippets de código | Salva e recupera trechos de código frequentes | nenhuma |
| `envsitter-guard` | Proteção de variáveis de ambiente | Previne vazamento de secrets/keys em prompts | nenhuma |
| `opencode-smart-title` | Títulos inteligentes de sessão | Gera nomes descritivos para sessões automaticamente | nenhuma |

## Notas

- **Um só orquestrador de propósito.** `oh-my-openagent` injeta os agentes
  (explorer, librarian, oracle, designer, fixer, etc.) e o prompt de
  orquestração. Não adicione outro framework de agentes — cada um adiciona
  dezenas de ferramentas ao contexto.
- **Memória:** `opencode-mem` é local-first; nada sai da máquina. Sem
  `supermemory`/contas — respeita a regra de "sem credenciais".
- **Ordem de carga:** os plugins são locais (scope `local`), lidos do
  `opencode.jsonc` deste repo.
