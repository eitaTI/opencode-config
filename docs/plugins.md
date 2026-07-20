# Plugins

Instalados pelo OpenCode via **npm** (runner único). Cada plugin abaixo é uma
entrada no array `"plugin"` do `opencode.jsonc`.

## Ativos

| Plugin | Propósito | Motivação | Config extra |
|--------|-----------|-----------|--------------|
| `@tarquinen/opencode-dcp` | Poda dinâmica do contexto da conversa | Otimiza uso de tokens em sessões longas | Configurável via `~/.config/opencode/dcp.jsonc` (Windows: `%USERPROFILE%\.config\opencode\dcp.jsonc`) |
| `opencode-mem` | Memória persistente local (SQLite + índice vetorial, embeddings locais) | Lembra o projeto e o usuário entre sessões, **sem API key** | `search`/`add`/`list` funcionam sem provedor; auto-captura precisa de modelo com tool-calls. Gera `opencode-mem.jsonc` (não versionar) |
| `opencode-wakatime` | Métricas de tempo de programação | Rastreia tempo gasto em cada projeto/file | Requer conta WakaTime + API key |
| `opencode-pty` | Suporte a PTY (pseudo-terminal) | Permite comandos interativos que precisam de TTY | nenhuma |
| `envsitter-guard` | Proteção de variáveis de ambiente | Previne vazamento de secrets/keys em prompts | nenhuma |
| `opencode-smart-title` | Títulos inteligentes de sessão | Gera nomes descritivos para sessões automaticamente | nenhuma |
| `openslimedit` | Compressão de tool descriptions e compactação de leitura | Reduz tokens em até 45% comprimindo metadados de ferramentas | nenhuma (zero config) |

## Notas

   - **Token optimization stack:** Otimização em três camadas complementares:
   1. **openslimedit** — comprime tool descriptions (até 45% de economia)
   2. **opencode-dcp** — poda contexto de conversa (50-70% de economia)
- **Memória:** `opencode-mem` é local-first; nada sai da máquina. Sem
  `supermemory`/contas — respeita a regra de "sem credenciais".
- **Ordem de carga:** os plugins são locais (scope `local`), lidos do
  `opencode.jsonc` deste repo.
