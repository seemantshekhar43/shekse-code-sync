# ShekseCodeSync

[![CI](https://github.com/seemantshekhar43/shekse-code-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/seemantshekhar43/shekse-code-sync/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Every DSA problem you solve on LeetCode, automatically version-controlled in your own GitHub repo, enriched with AI analysis, and turned into a searchable dashboard with a spaced-repetition revision engine.

## Screenshots

![Overview dashboard](docs/images/overview.png)
*Today's stats, recent submissions, and what's due for revision.*

<p float="left">
  <img src="docs/images/revision.png" width="49%" alt="Revision queue">
  <img src="docs/images/insights.png" width="49%" alt="Insights dashboard">
</p>

*Spaced-repetition revision, rated honestly (left) and pattern/difficulty coverage over time (right).*

## The problem this solves

If you practice data structures & algorithms regularly (interview prep, competitive programming, or just for fun), your solved problems end up scattered and disposable:

- LeetCode submission history has no lasting home you control - it's locked into the platform's UI.
- There's no record of *how* you solved something (approach, complexity, pattern used) beyond the code itself, so revisiting an old problem means re-deriving everything from scratch.
- Nothing resurfaces problems for you at the right time to actually retain them - once solved, a problem is effectively forgotten.
- There's no single view across your practice history to see patterns, gaps, streaks, or progress.

ShekseCodeSync fixes this by treating **your solved problems as a personal, versioned knowledge base**: every submission is captured automatically, committed to a GitHub repo you own, enriched with AI-generated notes (time/space complexity, pattern, optimization ideas), and fed into a spaced-repetition scheduler and an insights dashboard - so nothing you solve is ever thrown away, and revision happens on a schedule instead of never.

## The five pillars

**Capture** (browser extension) → **Store** (GitHub content + DB index) → **Analyze** (AI complexity, pattern, optimization) → **Revise** (spaced-repetition question queue) → **Visualize** (dashboard & insights).

## How it works

```mermaid
flowchart TB
  Ext["extension - WXT + React<br/>(captures on LeetCode)"]
  Web["web - Next.js dashboard<br/>(Auth.js / GitHub OAuth login)"]
  Api["api - NestJS HTTP API"]
  Worker["worker - NestJS<br/>(BullMQ consumer)"]
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

1. You solve a problem on LeetCode; the **extension** captures the question and your accepted solution.
2. The **API** commits both to your own GitHub repo (GitHub is the source of truth for your content) and indexes metadata in Postgres.
3. It returns immediately - capture never waits on an AI call. A job is enqueued for the **worker**.
4. The **worker** reads the statement + solution back from GitHub and asks an AI provider for complexity, pattern, and optimization notes.
5. The **web dashboard** shows your full history, a spaced-repetition (SM-2) revision queue, and an insights view (calendar heatmap, difficulty mix, pattern coverage, streaks).

See [`docs/TECH_STACK.md`](docs/TECH_STACK.md) for the full stack rationale, [`docs/PRD.md`](docs/PRD.md) for the data model, and [`docs/STATUS.md`](docs/STATUS.md) for current build status and what's next.

## Getting started (local dev)

Everything - API, worker, Postgres, Redis, the dashboard, and the extension - runs locally. This walks through it end to end: clone, register the two GitHub apps you need, fill in `.env`, bring up each service, and load the extension.

### 1. Prerequisites

- Node 20+
- [pnpm](https://pnpm.io) via `corepack enable pnpm`
- Docker (for Postgres + Redis, or the full `docker compose up --build` path)
- A GitHub account (you'll register two GitHub apps below) and, if you want AI enrichment working, an API key from your AI provider of choice (Anthropic, OpenAI, or a local Ollama install)

### 2. Clone and install

```bash
git clone https://github.com/seemantshekhar43/shekse-code-sync.git
cd shekse-code-sync
pnpm install
cp .env.example .env
```

You'll fill in `.env` in the next two steps - it starts with working defaults for `DATABASE_URL`, `REDIS_URL`, and the local ports; everything else is blank until registered.

### 3. Register a GitHub OAuth App (dashboard login)

The web dashboard signs users in with GitHub OAuth (Auth.js) - this is a separate registration from the GitHub App in the next step.

1. Go to [github.com/settings/applications/new](https://github.com/settings/applications/new).
2. **Application name**: anything, e.g. `ShekseCodeSync (local)`.
3. **Homepage URL**: `http://localhost:3000`.
4. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`.
5. Create it, then generate a **client secret**.
6. Copy the values into `.env`:
   ```bash
   AUTH_GITHUB_ID="<client ID>"
   AUTH_GITHUB_SECRET="<client secret>"
   ```
7. Generate the two Auth.js/token secrets `.env` also expects:
   ```bash
   openssl rand -base64 32   # -> AUTH_SECRET
   openssl rand -base64 32   # -> SCS_TOKEN_SECRET
   openssl rand -base64 32   # -> INTERNAL_API_SECRET
   ```
   Run it three times (or once and generate three different values) and paste each into its `.env` slot.

### 4. Register a GitHub App (repo writes)

Capture writes go straight to a GitHub repo you own via a GitHub App installation - this is what lets the API commit each problem + solution on your behalf.

1. Go to [github.com/settings/apps/new](https://github.com/settings/apps/new).
2. **GitHub App name**: anything unique, e.g. `sheksecodesync-local-<yourname>`.
3. **Homepage URL**: `http://localhost:3000`.
4. **Callback URL**: `http://localhost:3000/api/auth/callback/github` (only used if you enable "Request user authorization during installation" - safe to leave off for local dev).
5. **Setup URL** (under "Post installation"): `http://localhost:3000/github/installed`, and select "Redirect on update".
6. **Webhook**: uncheck "Active" - this project doesn't use GitHub webhooks.
7. **Permissions** → Repository permissions → **Contents: Read and write**.
8. **Where can this GitHub App be installed?**: "Only on this account" is fine for local dev.
9. Create the app. On the app's settings page:
   - Note the **App ID** and the app's **slug** (from the URL, `github.com/settings/apps/<slug>`).
   - Under "Client secrets", generate one.
   - Under "Private keys", generate and download a private key (`.pem` file).
10. Copy the values into `.env`:
    ```bash
    GITHUB_APP_ID="<app ID>"
    GITHUB_APP_CLIENT_ID="<client ID, shown near the top of the app's settings page>"
    GITHUB_APP_CLIENT_SECRET="<client secret>"
    NEXT_PUBLIC_GITHUB_APP_SLUG="<the slug>"
    # Paste the full .pem contents, keeping the \n line breaks. Easiest via:
    # awk 'BEGIN{ORS="\\n"} {print}' path/to/your-app.private-key.pem
    GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
    ```
11. You'll install the app on a repo from inside the dashboard once it's running (step 7 below) - no need to install it manually now.

### 5. Add an AI provider key

Pick one in `.env` (`AI_PROVIDER` is `anthropic`, `openai`, or `ollama`; default model `claude-opus-4-8`):

```bash
AI_PROVIDER="anthropic"
AI_MODEL="claude-opus-4-8"
ANTHROPIC_API_KEY="sk-ant-..."
```

Without a valid key, everything except AI enrichment still works - capture, GitHub commits, and the dashboard all function; the worker's enrichment job will just fail for that provider.

### 6. Bring up Postgres, Redis, and run migrations

```bash
docker compose up -d postgres redis
pnpm db:migrate                    # apply Prisma migrations
```

### 7. Start the API, worker, and web dashboard

```bash
pnpm dev                           # runs web, api, worker together via Turborepo
```

Or run each independently in its own terminal, useful when you want isolated logs:

```bash
pnpm --filter @scs/api dev         # http://localhost:3001
pnpm --filter @scs/worker dev      # BullMQ consumer, no HTTP port
pnpm --filter @scs/web dev         # http://localhost:3000
```

Open http://localhost:3000, sign in with GitHub, and connect a repo via the "Connect GitHub repo" prompt (this installs the GitHub App from step 4 on the repo you pick). From the dashboard's avatar menu, copy your ShekseCodeSync token - the extension needs it next.

### 8. Run the extension in dev mode

```bash
pnpm --filter @scs/extension dev
```

This starts WXT's dev build and opens a Chromium instance with the unpacked extension already loaded (in dev mode it points at `http://localhost:3001` instead of the production API). Click the extension icon, paste the token you copied in step 7, and solve/submit a problem on LeetCode to see it captured.

Prefer a manually-loaded unpacked build instead of WXT's auto-launched browser? `pnpm --filter @scs/extension build` writes one to `apps/extension/.output/`; load that folder via `chrome://extensions` → Developer mode → Load unpacked. See "Installing the extension" below for the packaged, store-equivalent build.

### All-in-one via Docker

Once `.env` is filled in, `docker compose up --build` runs all five services (web, api, worker, postgres, redis) in containers instead of the steps above - see "System requirements" below for the memory Docker needs for this.

`pnpm test`, `pnpm typecheck`, and `pnpm lint` run across the whole workspace at any point.

## Stack

TypeScript monorepo (pnpm + Turborepo): WXT extension, NestJS API + worker, Next.js dashboard, Postgres + Prisma, BullMQ + Redis, an AI provider behind a swappable interface (default Claude Opus 4.8, via a provider-agnostic Vercel AI SDK layer), Auth.js + GitHub App, all in one `docker-compose.yml`. Self-hosted.

Apps: `extension`, `api`, `worker`, `web`. Shared packages: `types`, `db`, `ai`, `github`.

## Testing

One test runner across the monorepo: **Vitest** for unit + integration; **Playwright** for end-to-end (dashboard flows, extension capture).

```bash
pnpm test          # all unit + integration tests
pnpm test:watch    # watch mode
pnpm typecheck     # tsc --noEmit across the workspace
pnpm lint          # ESLint
pnpm e2e           # Playwright end-to-end
pnpm --filter @scs/api test   # scope to one package/app
```

Conventions:
- Co-locate unit tests next to source as `*.test.ts`; keep them DB- and network-free (mock the AI package, Octokit, Prisma).
- Integration tests that need a DB use a disposable Postgres (Docker/testcontainers) and a separate test database - never the dev DB.
- E2E lives in `apps/web/e2e` and `apps/extension/e2e`.

## System requirements

### Local development

- **Docker memory: allocate at least 4GB, ideally 6GB+.** Building `api`/`worker`/`web`'s images concurrently (`docker compose up --build`) has been observed to OOM-kill `pnpm install` on a Docker Desktop VM with ~2GB allocated. If you're memory-constrained, build one service at a time instead (`docker compose build api && docker compose build worker && docker compose build web`).
- **Disk: ~10GB free** - pnpm's store + each app's `node_modules`, Docker image layers for five services, and the Postgres data volume.

### Production (self-hosted, sized for ~50 active users)

This is a low-traffic, bursty workload (people solving problems occasionally, not a high-QPS API), so the footprint stays small even fully loaded. `web` runs on Vercel and isn't part of this budget - this is for whatever's hosting `api` + `worker` + `postgres` + `redis`:

| Service | RAM | vCPU | Why |
|---|---|---|---|
| `api` | 512MB-1GB | 1 | Request volume is low and bursty: dashboard reads + capture writes |
| `worker` | 512MB-1GB | 1 | Network-bound on the AI provider call, not CPU-heavy |
| `postgres` | 1-2GB | 1 | Dataset stays small - even a few hundred problems per user across 50 users is well under 1GB of data |
| `redis` | 256MB | shared | Just BullMQ queue state; no meaningful storage |

**Recommended: 4 vCPUs, 6-8GB RAM, 20GB disk** for the host running those four services - the extra headroom over the per-service numbers above covers Postgres growth, Docker image layers, logs, and (if self-hosting like the maintainer does) Caddy/`cloudflared` running alongside it on the same box.

These are reasoned starting points, not load-tested numbers - revisit if usage patterns (AI-enrichment concurrency, solution code size, submission volume per user) diverge from a typical DSA-practice history.

## Deploying `api`/`worker`

Every merge to `main` builds `apps/api/Dockerfile` and `apps/worker/Dockerfile` and pushes them to GHCR, tagged `latest` and the commit SHA (for rollback): `ghcr.io/<owner>/scs-api`, `ghcr.io/<owner>/scs-worker`. `web` is not part of this - it deploys separately via Vercel.

Pushing a semver tag (`v*.*.*`) additionally builds and pushes images tagged with that version and creates a GitHub Release with the `docker pull` commands in its notes. Either way, each package (`scs-api`, `scs-worker`) keeps only its 3 most recent image versions - older ones are pruned automatically.

On the host running `docker-compose.yml`, pull and restart manually once a merge (or release) lands:

```bash
docker compose pull api worker
docker compose up -d api worker
```

This is a manual step by design (start simple, automate only if it becomes friction) - no auto-deploy agent like Watchtower is running.

## Installing the extension

Live on the Chrome Web Store: [ShekseCodeSync](https://chromewebstore.google.com/detail/sheksecodesync/fnnpoamogllemobnepdnddagokmjicho). Install it, open the popup, and paste in your ShekseCodeSync token (from the dashboard's avatar menu) to connect it to your account. Store installs update automatically.

### Testing an unreleased build

To try changes off the tip of `main` before they're published to the store:

1. Grab the `extension-zip` workflow artifact from the latest successful [Build images](https://github.com/seemantshekhar43/shekse-code-sync/actions/workflows/build-images.yml) run and unzip it.
2. In Chrome (or another Chromium browser), go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.

## Contributing

This project is open source and contributions are welcome - bug reports, feature ideas, docs fixes, and pull requests.

- **Found a bug or have an idea?** [Open an issue](https://github.com/seemantshekhar43/shekse-code-sync/issues/new). Open issues are the backlog, so check existing ones first to avoid duplicates.
- **Want to contribute code?** Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the fork/branch/PR workflow, code style, and testing expectations.
- **Working conventions** (issue-driven flow, decision log, how AI coding agents should operate in this repo) live in [`CLAUDE.md`](CLAUDE.md) / `AGENTS.md`.

## Built with the axi tools

This project is developed with a set of CLI tools by [kunchenguid](https://axi.md/) that pair well with AI coding agents:

- [**axi.md**](https://axi.md/) - the project/tool suite this repo's workflow is built around.
- [**no-mistakes**](https://github.com/kunchenguid/no-mistakes) - a local validation gate (AI code review, tests, lint, push, PR, CI monitoring) run before a change reaches `origin`.
- [**lavish**](https://github.com/kunchenguid/lavish-axi) - turns a plan, design decision, or comparison into a reviewable HTML artifact.
- [**gh-axi**](https://github.com/kunchenguid/gh-axi) - a CLI for GitHub operations (issues, PRs, CI, releases).
- [**chrome-devtools-axi**](https://github.com/kunchenguid/chrome-devtools-axi) - drives a real Chrome session to verify UI changes end-to-end.

If you're contributing here (or building your own project alongside an AI coding agent), these are worth a look for the same reasons we use them: they catch real bugs before a PR goes up and keep the loop between "I made a change" and "I know it works" short.

## License

[MIT](LICENSE) - use it, fork it, ship it.
