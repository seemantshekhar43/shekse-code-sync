# ShekseCodeSync — Decision Log

A running record of the significant decisions and their rationale. Newest sections appended over time.

## 2026-07-25 — Product & architecture (PRD sign-off)

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Audience | Multi-user product with accounts | Accounts, auth, per-user repos & data isolation from day one |
| 2 | Source of truth | GitHub is SoT, DB is a rebuildable index | Content diffable/shareable in Git; DB serves dashboard & revision queries |
| 3 | Platforms at launch | LeetCode + NeetCode | Pluggable capture adapters from the start |
| 4 | AI timing | Auto on capture, **fire-and-forget** | API returns 200 after GitHub+DB, then queues the AI job; worker enriches later & retries |
| 5 | Deployment | Self-hosted, Docker on homelab | Container images + docker-compose; deps self-containable |
| 6 | Spaced repetition | Yes — Anki-style scheduling (v2) | Self-rated revision attempts drive an SRS scheduler; needs its own table |
| 7 | GitHub auth | GitHub App (not OAuth App / PAT) | Fine-grained, per-repo, revocable, short-lived tokens. Plugin never holds GitHub creds. |

## 2026-07-25 — Tech stack

| # | Decision | Choice | Alternative considered |
|---|---|---|---|
| 8 | Language | TypeScript end-to-end | — |
| 9 | Monorepo | pnpm workspaces + Turborepo | Nx |
| 10 | Browser plugin | WXT + React | Plasmo |
| 11 | Backend/worker | NestJS | Fastify |
| 12 | Database | PostgreSQL + Prisma | SQLite; Drizzle |
| 13 | Job queue | BullMQ + Redis | pg-boss |
| 14 | AI default model | Claude Opus 4.8 (`claude-opus-4-8`) | Local Ollama |
| 15 | AI portability | Vercel AI SDK abstraction behind `packages/ai`; model = env var | Pure OpenAI-compatible wire via LiteLLM proxy |
| 16 | Frontend | Next.js + Tailwind + shadcn/ui + Recharts; CodeMirror 6 | Vite + React; Monaco |
| 17 | Auth | Auth.js (GitHub OAuth) + Octokit GitHub App | Lucia |
| 18 | Packaging | docker-compose (web, api, worker, postgres, redis) | — |

## 2026-07-26 — UI design direction (issue #14, lavish sign-off)

Look-and-feel for **both** the browser plugin popup and the web dashboard, finalized in a lavish session and signed off. Full tokens live in [`docs/DESIGN.md`](./DESIGN.md); visual reference in [`docs/design/ui-direction.html`](./design/ui-direction.html).

| # | Decision | Choice | Why |
|---|---|---|---|
| 19 | Aesthetic | axi.md-inspired: warm paper, serif display, one green accent, content-first | Typography-forward, quiet, distinctive; the axi.md font is the standout we wanted |
| 20 | Display font | Source Serif 4 (weight 600), with `[bracketed]` green accent phrases | Matches axi.md's serif; carries headlines + stat values |
| 21 | UI / mono fonts | Inter (interface/body) + JetBrains Mono (code, metrics) | axi.md's real stack; self-hosted via `next/font` in-product |
| 22 | Palette | Paper `#F5F2ED`, ink `#1A1A1A`, green `#1A6B5A`; amber/red added for difficulty | Warm neutral base from axi.md; amber/red needed to encode Easy/Medium/Hard |
| 23 | Two surfaces, one system | Popup is a compact sibling of the dashboard (same tokens) | Consistent product feel across capture and review |
| 24 | Overview table | No GitHub sync-status column on the overview; it lives on the detailed problems grid | Keep the overview scannable; sync detail belongs in the drill-down |
