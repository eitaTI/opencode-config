---
name: agent-orchestration
description: Decide when to delegate work to the oh-my-openagent multi-agent orchestrator versus working directly in the current session. Use when a task is large or multi-shaped (scaffolding, mixed models, parallel sub-tasks) rather than a small single-file edit.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: orchestration
---
## What this skill covers
This repo uses **oh-my-openagent** (★63k+) as the single multi-agent
orchestrator for OpenCode, plus **opencode-mem** for local, credential-free
memory. Both run through npx.

## When to use the orchestrator
Delegate to oh-my-openagent when the task is large or multi-shaped:
- Scaffolding a feature across explorer + implementer + reviewer agents
- Mixing models (e.g. a fast model for exploration, a strong one for code)
- Parallel sub-tasks that should not block the main session

## When to stay in the current session
- Small, single-file edits
- Conversational planning or questions
- Tasks where you want to keep full context yourself

## Memory
- `opencode-mem` stores project + user-profile memories locally (SQLite +
  vector index, local embeddings). No API key required.
- Memory search/add/list work without any provider; auto-capture needs a
  model that returns tool-call/structured output.

## Notes
- Only one orchestrator is configured on purpose — avoid stacking multiple
  agent frameworks, as each adds many tools/agents to the context.
- All MCP servers and plugins run via `npx`; keep that as the single
  runner for portability.
