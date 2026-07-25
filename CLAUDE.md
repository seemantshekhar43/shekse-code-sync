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

## Stack quick reference

TypeScript monorepo (pnpm + Turborepo). Apps: `extension` (WXT), `api` + `worker` (NestJS), `web` (Next.js). Packages: `types`, `db` (Prisma), `ai` (Vercel AI SDK behind an `AiProvider` interface, default model `claude-opus-4-8`, provider swappable by env var), `github` (Octokit + GitHub App). Postgres + BullMQ/Redis. All via one `docker-compose.yml`.

## Conventions

- Never use the em dash; use a plain dash.
- Never manually edit auto-generated files (CHANGELOG, generated clients).
- Prefer quality, simplicity, robustness, and long-term maintainability over development cost.
