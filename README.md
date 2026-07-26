# ShekseCodeSync

Capture every DSA problem you solve on LeetCode / NeetCode, version-control the question and solution in GitHub, enrich it with AI, and turn your history into a searchable dashboard and a smart revision engine.

## Status

Monorepo scaffolded and green in CI; first MVP read-path slice done. See the docs:

- [Product Requirements](docs/PRD.md)
- [Tech Stack](docs/TECH_STACK.md)
- [Decision Log](docs/DECISIONS.md)
- [Design Direction](docs/DESIGN.md)

## Where we are / what's next (source of truth = GitHub issues)

Work is tracked as GitHub issues; **open issues are the backlog, closed issues are done**.

```bash
gh-axi issue list --state open      # what's next
gh-axi issue list --state closed    # what's done
```

Done so far: PRD + tech stack signed off, monorepo scaffolded (apps + shared packages, Docker, CI), read-path MVP slice (list submissions), capture write-path MVP slice (commit each problem to the user's GitHub repo on capture, GitHub as source of truth), AI-analysis slice (worker reads the statement + solution back from GitHub and writes complexity/pattern/optimization notes). Next up (open issues): finalize UI design in lavish, extension LeetCode capture.

The working conventions (issue-driven flow, lavish for planning/design, no-mistakes gate for feature work, chrome-devtools-axi for UI verification) live in [`CLAUDE.md`](CLAUDE.md), which a fresh Claude Code session loads automatically.

## The five pillars

**Capture** (browser plugin) → **Store** (GitHub content + DB index) → **Analyze** (AI complexity, pattern, optimization) → **Revise** (question banks & quizzes) → **Visualize** (dashboard & insights).

## Stack

TypeScript monorepo (pnpm + Turborepo): WXT extension, NestJS API + worker, Next.js dashboard, Postgres + Prisma, BullMQ + Redis, Claude Opus 4.8 via a provider-agnostic Vercel AI SDK layer, Auth.js + GitHub App, all in one `docker-compose.yml`. Self-hosted.
