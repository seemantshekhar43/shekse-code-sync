# ShekseCodeSync — Tech Stack

> Status: signed off (2026-07-25). Interactive version: `.lavish/shekse-code-sync-stack.html`.

## Guiding decision

**TypeScript end-to-end.** The browser plugin must be JS/TS, and a "submission" flows through plugin → API → worker → dashboard. One shared type definition across all of them is the biggest maintainability win available, so TypeScript is used everywhere.

## Stack at a glance

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript | Forced by the extension; shared types everywhere |
| Monorepo | pnpm workspaces + Turborepo | Share `@scs/types` across all apps |
| Browser plugin | WXT + React | Best-maintained Manifest V3 framework, cross-browser |
| Backend API | NestJS | Structured, DI, scales as domains grow |
| Worker | NestJS (separate process) | Drains the queue for AI enrichment |
| Database | PostgreSQL | Concurrent writes, JSONB, full-text search |
| ORM | Prisma | Type-safe, first-class migrations |
| Job queue | BullMQ + Redis | Robust retries, backoff, rate-limit, dashboard |
| AI layer | Vercel AI SDK (`ai`), default `claude-opus-4-8` | Provider-agnostic — see below |
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui + TanStack Query + Recharts | SSR dashboard |
| Editors | CodeMirror 6 | Markdown + code editors in the manual-entry form |
| Auth (login) | Auth.js (NextAuth v5), GitHub OAuth | Multi-user, self-hostable |
| GitHub writes | Octokit + GitHub App | Short-lived per-commit tokens (PRD §Auth) |
| Packaging | Docker + docker-compose | web · api · worker · postgres · redis |

## Monorepo shape

```
shekse-code-sync/
  apps/
    extension/   # WXT + React (MV3)
    api/         # NestJS HTTP API
    worker/      # NestJS AI-enrichment worker
    web/         # Next.js dashboard
  packages/
    types/       # @scs/types - shared DTOs (single source of truth)
    db/          # Prisma schema + client (shared by api + worker)
    ai/          # AiProvider interface + adapters
    github/      # Octokit / GitHub App helpers
  docker-compose.yml
```

## AI layer — no vendor lock-in

The model is a **config value, not a code dependency**. The worker talks to a **Vercel AI SDK** unified interface behind our own tiny `AiProvider` in `packages/ai`. `generateObject()` + a Zod schema returns typed complexity/pattern/optimization analysis from any provider.

Swap the provider/model by changing environment variables — no code change:

```
AI_PROVIDER=anthropic
AI_MODEL=claude-opus-4-8
#   → openai / gpt-...
#   → ollama / llama3   (local, on the homelab)
```

**Chosen:** Vercel AI SDK abstraction — portable *and* keeps each provider's native strengths. Adding a provider = one adapter.

**Alternative considered:** a pure OpenAI-compatible wire format (OpenAI SDK + LiteLLM proxy fronting every provider). Maximally standard but lowest-common-denominator — forfeits provider-native features. Documented as the fallback.

## Deployment topology

One `docker-compose.yml` on the homelab brings up five services: `web`, `api`, `worker`, `postgres`, `redis`. The extension builds to a zip loaded/published separately. Config (GitHub App key, AI provider + key) via `.env`.

## Async AI flow

The API returns `200` as soon as GitHub + DB writes succeed, then enqueues an AI-enrichment job. A background worker picks it up, calls the model, updates the DB row and appends notes to `meta.json`, and retries on failure. The capture path never waits on the model.
