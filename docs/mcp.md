# MCP servers

Todos os servidores locais rodam via **`npx -y`** (Node.js) — runner único e
portátil. Servidores remotos usam HTTP/SSE e não precisam de runner local.

Regra geral: MCPs adicionam ferramentas ao contexto do modelo. Mantenha
apenas os necessários por projeto.

## Ativos — sem credencial

| Nome | Tipo | Pacote / URL | Motivação | Config extra |
|------|------|--------------|-----------|--------------|
| `context7` | remoto | `https://mcp.context7.com/mcp` | Documentação de libs atualizada direto na IDE (sem alucinação de API) | nenhuma |
| `fetch` | local | `uvx mcp-server-fetch` | Recupera conteúdo de URLs para o agente ler páginas/docs | nenhuma |
| `sequentialthinking` | local | `npx -y @modelcontextprotocol/server-sequential-thinking` | Ferramenta de raciocínio passo-a-passo para problemas complexos | nenhuma |
| `git` | local | `npx -y @cyanheads/git-mcp-server` | Operações Git versionadas via MCP (alternativa node ao `mcp-server-git` do Python) | nenhuma |
| `sqlite` | local | `npx -y @mokei/mcp-sqlite --db :memory:` | Consulta/gera bancos SQLite via MCP | nenhuma (default em memória; para um arquivo, copie a entrada com `--db /caminho.db`) |

## Opcionais — desativados por padrão

| Nome | Pacote | Por que desativado | Para ativar |
|------|--------|-------------------|--------------|
| `playwright` | `npx -y @playwright/mcp@latest --headless` | Automação de browser; token-heavy; baixa seu próprio navegador (`npx playwright install`) | Troque `"enabled": false` por `true`; rode `npx playwright install` |

## Desativado — exige API key

| Nome | Pacote | Config extra |
|------|--------|--------------|
| `brave-search` | `npx -y @brave/brave-search-mcp-server --transport stdio` | Exporte `BRAVE_API_KEY` (ou `BRAVE_API_KEY_FILE`) e troque `"enabled": false` por `true` |
