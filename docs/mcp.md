# MCP servers

Todos os servidores locais rodam via **`bunx`** (Bun) — runner único e
portátil. Servidores remotos usam HTTP/SSE e não precisam de runner local.

Regra geral: MCPs adicionam ferramentas ao contexto do modelo. Mantenha
ativos apenas os necessários por projeto.

## Ativos — sem credencial

| Nome | Tipo | Pacote / URL | Motivação | Config extra |
|------|------|--------------|-----------|--------------|
| `context7` | remoto | `https://mcp.context7.com/mcp` | Documentação de libs atualizada direto na IDE (sem alucinação de API) | nenhuma |
| `gh_grep` | remoto | `https://mcp.grep.app` | Busca de código em repositórios via grep.app | nenhuma |
| `fetch` | local | `bunx @modelcontextprotocol/server-fetch` | Recupera conteúdo de URLs para o agente ler páginas/docs | nenhuma |
| `sequentialthinking` | local | `bunx @modelcontextprotocol/server-sequentialthinking` | Ferramenta de raciocínio passo-a-passo para problemas complexos | nenhuma |
| `git` | local | `bunx @cyanheads/git-mcp-server` | Operações Git versionadas via MCP (alternativa node ao `mcp-server-git` do Python) | nenhuma |

## Opcionais — desativados por padrão

| Nome | Pacote | Por que desativado | Para ativar |
|------|--------|-------------------|--------------|
| `playwright` | `bunx @playwright/mcp@latest --headless` | Automação de browser; token-heavy; baixa seu próprio navegador (`bunx playwright install`) | Troque `"enabled": false` por `true`; rode `bunx playwright install` |

## Desativado — exige API key

| Nome | Pacote | Config extra |
|------|--------|--------------|
| `brave-search` | `bunx @brave/brave-search-mcp-server --transport stdio` | Exporte `BRAVE_API_KEY` (ou `BRAVE_API_KEY_FILE`) e troque `"enabled": false` por `true` |

## MCP adicionado por plugin

O plugin **`opencode-websearch-cited`** injeta um MCP remoto `websearch`
(`https://mcp.exa.ai/mcp?tools=web_search_exa`) que traz busca web com
citações. Conta como ativo por padrão (parte do plugin, não do bloco `mcp`).
