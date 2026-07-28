# ShekseCodeSync

Capture every DSA problem you solve on LeetCode / NeetCode, version-control the question and solution in GitHub, enrich it with AI, and turn your history into a searchable dashboard and a smart revision engine.

## Status

Monorepo scaffolded and green in CI; first MVP read-path slice done. See the docs:

- [Product Requirements](docs/PRD.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Decision Log](docs/DECISIONS.md)
- [Design Direction](docs/DESIGN.md)
- [Feature Ideas (v2+ candidates)](docs/FEATURE_IDEAS.md) — draft brainstorm for review

## Where we are / what's next (source of truth = GitHub issues)

Work is tracked as GitHub issues; **open issues are the backlog, closed issues are done**.

```bash
gh-axi issue list --state open      # what's next
gh-axi issue list --state closed    # what's done
```

Done so far: PRD + tech stack signed off, monorepo scaffolded (apps + shared packages, Docker, CI), read-path MVP slice (list submissions), capture write-path MVP slice (commit each problem to the user's GitHub repo on capture, GitHub as source of truth), AI-analysis slice (worker reads the statement + solution back from GitHub and writes complexity/pattern/optimization notes), web dashboard rebuilt in the locked axi.md design, Problems screen (filterable/sortable/paginated submissions grid with per-row GitHub sync status and a read-only code viewer), manual "Add problem" entry point, SRS revision engine (SM-2 scheduler, `POST /revisions` rating + `GET /revisions/queue`, Overview rail wired to real due dates), dedicated Revision screen (`GET /revisions/full-queue`, due-now/soon/upcoming segments, remove-from-queue action), dedicated Insights screen (`GET /insights?year=`, full-year calendar heatmap with click-through, difficulty mix, pattern coverage, streaks, rule-based AI observations). Next up (open issues): LLM-generated AI insights (#51), NeetCode capture adapter, live end-to-end tests.

The working conventions (issue-driven flow, lavish for planning/design, no-mistakes gate for feature work, chrome-devtools-axi for UI verification) live in [`CLAUDE.md`](CLAUDE.md), which a fresh Claude Code session loads automatically.

## The five pillars

**Capture** (browser plugin) → **Store** (GitHub content + DB index) → **Analyze** (AI complexity, pattern, optimization) → **Revise** (question banks & quizzes) → **Visualize** (dashboard & insights).

## Architecture

```mermaid
flowchart TB
  Ext["extension — WXT + React<br/>(captures on LeetCode / NeetCode)"]
  Web["web — Next.js dashboard<br/>(Auth.js / GitHub OAuth login)"]
  Api["api — NestJS HTTP API"]
  Worker["worker — NestJS<br/>(BullMQ consumer)"]
  PG[("postgres")]
  Redis[("redis<br/>BullMQ queue")]
  GH["GitHub<br/>(Octokit + GitHub App)"]
  AI["AI provider<br/>(Anthropic / OpenAI / Ollama)"]

  Ext -->|"bearer token"| Api
  Web -->|"server-side fetch"| Api
  Api --> PG
  Api -->|"enqueue enrichment job"| Redis
  Api -->|"commit code + question"| GH
  Worker -->|"dequeue job"| Redis
  Worker --> PG
  Worker -->|"read statement + solution back"| GH
  Worker -->|"complexity / pattern / optimization"| AI
```

The API returns as soon as the GitHub commit + DB write succeed; AI enrichment runs async on the worker so capture never waits on a model call. See [`docs/TECH_STACK.md`](docs/TECH_STACK.md) for the full rationale and [`docs/PRD.md`](docs/PRD.md) for the data model.

## Getting started (local dev)

Prerequisites: Node 20+, [pnpm](https://pnpm.io) (via `corepack enable pnpm`), Docker.

```bash
git clone https://github.com/seemantshekhar43/shekse-code-sync.git
cd shekse-code-sync
pnpm install
cp .env.example .env               # fill in GitHub OAuth/App creds + an AI provider key
docker compose up -d postgres redis
pnpm db:migrate                    # apply Prisma migrations
pnpm dev                           # runs web, api, worker together via Turborepo
```

- Dashboard: http://localhost:3000
- API: http://localhost:3001
- Extension: `pnpm --filter @scs/extension dev`, then load the unpacked build in your browser

`.env.example` documents every variable, including how to register the GitHub OAuth App and GitHub App the login and repo-write flows need. `pnpm test`, `pnpm typecheck`, and `pnpm lint` run across the whole workspace; see [`CLAUDE.md`](CLAUDE.md) for the full local runbook (Chrome-driven UI verification, the `no-mistakes` validation gate, etc.) if you're contributing.

## System requirements

### Local development

- **Docker memory: allocate at least 4GB, ideally 6GB+.** Building `api`/`worker`/`web`'s images concurrently (`docker compose up --build`) has been observed to OOM-kill `pnpm install` on a Docker Desktop VM with ~2GB allocated. If you're memory-constrained, build one service at a time instead (`docker compose build api && docker compose build worker && docker compose build web`).
- **Disk: ~10GB free** — pnpm's store + each app's `node_modules`, Docker image layers for five services, and the Postgres data volume.

### Production (self-hosted, sized for ~50 active users)

This is a low-traffic, bursty workload (people solving problems occasionally, not a high-QPS API), so the footprint stays small even fully loaded. `web` runs on Vercel and isn't part of this budget — this is for whatever's hosting `api` + `worker` + `postgres` + `redis`:

| Service | RAM | vCPU | Why |
|---|---|---|---|
| `api` | 512MB–1GB | 1 | Request volume is low and bursty: dashboard reads + capture writes |
| `worker` | 512MB–1GB | 1 | Network-bound on the AI provider call, not CPU-heavy |
| `postgres` | 1–2GB | 1 | Dataset stays small — even a few hundred problems per user across 50 users is well under 1GB of data |
| `redis` | 256MB | shared | Just BullMQ queue state; no meaningful storage |

**Recommended: 4 vCPUs, 6–8GB RAM, 20GB disk** for the host running those four services — the extra headroom over the per-service numbers above covers Postgres growth, Docker image layers, logs, and (if self-hosting like the maintainer does) Caddy/`cloudflared` running alongside it on the same box.

These are reasoned starting points, not load-tested numbers — revisit if usage patterns (AI-enrichment concurrency, solution code size, submission volume per user) diverge from a typical DSA-practice history.

## Deploying `api`/`worker`

Every merge to `main` builds `apps/api/Dockerfile` and `apps/worker/Dockerfile` and pushes them to GHCR, tagged `latest` and the commit SHA (for rollback): `ghcr.io/<owner>/scs-api`, `ghcr.io/<owner>/scs-worker`. `web` is not part of this - it deploys separately via Vercel.

On the host running `docker-compose.yml`, pull and restart manually once a merge lands:

```bash
docker compose pull api worker
docker compose up -d api worker
```

This is a manual step by design (this project's convention: start simple, automate only if it becomes friction) - no auto-deploy agent like Watchtower is running.

## Stack

TypeScript monorepo (pnpm + Turborepo): WXT extension, NestJS API + worker, Next.js dashboard, Postgres + Prisma, BullMQ + Redis, Claude Opus 4.8 via a provider-agnostic Vercel AI SDK layer, Auth.js + GitHub App, all in one `docker-compose.yml`. Self-hosted.
