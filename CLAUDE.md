# ShekseCodeSync — Agent Instructions

Project context and the working pattern to follow. (Also readable as `AGENTS.md`.)

## What this project is

ShekseCodeSync captures every DSA problem solved on LeetCode / NeetCode, version-controls the question + solution in GitHub, enriches it with AI, and drives a revision engine and insights dashboard. See `docs/` for the full context:

- `docs/PRD.md` — product requirements (vision, pillars, data model, roadmap, auth).
- `docs/TECH_STACK.md` — the chosen stack and monorepo shape.
- `docs/DECISIONS.md` — decision log; append new significant decisions here.

## Working pattern (follow this on every task)

1. **Track work as tasks.** Break work into tasks, keep exactly one `in_progress` at a time, and mark each `completed` the moment it's actually done. Add follow-up tasks as they surface.
2. **Keep the decision log current.** When a significant decision is made, append it to `docs/DECISIONS.md`.
3. **Commit and push through GitHub.** After a coherent unit of work, commit with a clear message and push. Use the **gh-axi** skill for all GitHub operations (repos, PRs, issues, CI) rather than raw `gh`.
4. **Branch, don't commit to the default branch directly** for feature work; open a PR.
5. Don't push or perform outward-facing actions without the work being complete and, where it's a new external action, confirmed.

## Stack quick reference

TypeScript monorepo (pnpm + Turborepo). Apps: `extension` (WXT), `api` + `worker` (NestJS), `web` (Next.js). Packages: `types`, `db` (Prisma), `ai` (Vercel AI SDK behind an `AiProvider` interface, default model `claude-opus-4-8`, provider swappable by env var), `github` (Octokit + GitHub App). Postgres + BullMQ/Redis. All via one `docker-compose.yml`.

## Conventions

- Never use the em dash; use a plain dash.
- Never manually edit auto-generated files (CHANGELOG, generated clients).
- Prefer quality, simplicity, robustness, and long-term maintainability over development cost.
