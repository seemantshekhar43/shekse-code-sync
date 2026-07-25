# ShekseCodeSync — Agent Instructions

Project context and the working pattern to follow. (Also readable as `AGENTS.md`.)

## What this project is

ShekseCodeSync captures every DSA problem solved on LeetCode / NeetCode, version-controls the question + solution in GitHub, enriches it with AI, and drives a revision engine and insights dashboard. See `docs/` for the full context:

- `docs/PRD.md` — product requirements (vision, pillars, data model, roadmap, auth).
- `docs/TECH_STACK.md` — the chosen stack and monorepo shape.
- `docs/DECISIONS.md` — decision log; append new significant decisions here.

## Working pattern (follow this on every task)

Work is tracked as **GitHub issues**. For each unit of work:

1. **Create the issue first.** Open a GitHub issue describing the task before starting. Use the **gh-axi** skill for all GitHub operations (issues, repos, PRs, CI) rather than raw `gh`:
   `npx -y gh-axi issue create --title "..." --body "..."` → note the issue number.
2. **Act on it.** For feature work, branch off `main` (e.g. `git checkout -b feat/<slug>`); trivial repo-hygiene work may go straight on `main`.
3. **Close it from the commit message.** Reference the issue in the commit so the push closes it automatically:
   ```
   git commit -m "Scaffold monorepo

   Closes #6"
   ```
   Use `Closes #N` / `Fixes #N` so the commit both does the work and closes the task. On a branch, put `Closes #N` in the commit or the PR body; the issue closes when the PR merges to `main`.
4. **Keep the decision log current.** When a significant decision is made, append it to `docs/DECISIONS.md`.
5. Don't push or perform outward-facing actions without the work being complete and, where it's a new external action, confirmed.

## Planning & big decisions — use lavish

For anything bigger than a routine change, use the **lavish** skill to produce a reviewable artifact before building, so decisions can be seen and annotated. Use it for:

- **PRDs and product scope** (see `docs/PRD.md`).
- **Tech-stack and architecture decisions** (see `docs/TECH_STACK.md`).
- **Design / look-and-feel decisions** — UI mockups, component/visual direction, dashboard layouts.
- **Any big decision, or a set of several related decisions at once** — surface the options and trade-offs in lavish and let the user choose there.

After a decision is made, record it in `docs/DECISIONS.md` and reflect it in the relevant doc.

## Stack quick reference

TypeScript monorepo (pnpm + Turborepo). Apps: `extension` (WXT), `api` + `worker` (NestJS), `web` (Next.js). Packages: `types`, `db` (Prisma), `ai` (Vercel AI SDK behind an `AiProvider` interface, default model `claude-opus-4-8`, provider swappable by env var), `github` (Octokit + GitHub App). Postgres + BullMQ/Redis. All via one `docker-compose.yml`.

## Running the project

Prerequisites: Node 20+, pnpm (via `corepack enable pnpm`), Docker (for Postgres + Redis).

```bash
pnpm install                       # install the whole workspace
cp .env.example .env               # then fill in secrets
docker compose up -d postgres redis
pnpm db:migrate                    # apply Prisma migrations
pnpm dev                           # run all apps (Turborepo) - or filter:
pnpm --filter @scs/api dev
pnpm --filter @scs/web dev
pnpm --filter @scs/worker dev
pnpm --filter @scs/extension dev   # WXT dev build for the browser
```

Full stack in containers: `docker compose up --build` (web · api · worker · postgres · redis).

## Testing

One test runner across the monorepo: **Vitest** for unit + integration; **Playwright** for end-to-end (dashboard flows, extension capture). Run via Turborepo:

```bash
pnpm test          # all unit + integration tests
pnpm test:watch    # watch mode
pnpm typecheck     # tsc --noEmit across the workspace
pnpm lint          # ESLint
pnpm e2e           # Playwright end-to-end
pnpm --filter @scs/api test   # scope to one package/app
```

Conventions:
- Co-locate unit tests next to source as `*.test.ts`; keep them DB- and network-free (mock `packages/ai`, Octokit, Prisma).
- Integration tests that need a DB use a disposable Postgres (Docker/testcontainers) and a separate test database - never the dev DB.
- E2E lives in `apps/web/e2e` and `apps/extension/e2e`.
- **Chrome UI testing:** verify any UI change to the web dashboard or the extension's on-page behavior by driving a real Chrome session with the `chrome-devtools-axi` skill (navigate, snapshot, click, fill, read console/network, screenshot) against the running app - don't sign off UI work on typecheck/build alone.
- **Before marking work done, verify the actual behavior end-to-end** (drive the real flow via the `verify`/`run`/`chrome-devtools-axi` skills), not just green unit tests. A green test suite is necessary, not sufficient.
- Don't close an issue / mark a task done while typecheck, lint, or tests fail.

## Conventions

- Never use the em dash; use a plain dash.
- Never manually edit auto-generated files (CHANGELOG, generated clients).
- Prefer quality, simplicity, robustness, and long-term maintainability over development cost.
