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

## 2026-07-26 - Per-user auth for the ShekseCodeSync token (issue #26)

Replaced the hardcoded `demo-user` on the API with real per-user auth: captures and dashboard reads are scoped to the signed-in user, and missing/invalid tokens are rejected 401.

| # | Decision | Choice | Alternative considered |
|---|---|---|---|
| 25 | Token scheme | Signed JWT `{sub: userId}`, HS256 with a shared `SCS_TOKEN_SECRET` (web mints, api verifies statelessly via `jose`); long-lived (365d) since it is pasted into the extension | Opaque DB-stored token - avoided a schema change and a per-request DB lookup; tradeoff is revocation via secret rotation/expiry, not instant |
| 26 | User persistence | Auth.js stays on JWT sessions with **no** Prisma adapter; the `jwt` callback upserts a `User` row by GitHub email and carries its cuid as `userId` | Prisma adapter (Account/Session/VerificationToken tables) - unneeded because repo writes use the separate GitHub App, not this login |

## 2026-07-26 - Per-user GitHub App install flow (issue #25)

Replaced the `DEMO_GITHUB_*` env bridge with a real per-user install flow: each user connects the GitHub App to their own repo, and the API resolves the sync target from the `User` row (`githubInstallationId` / `githubRepo`) set at install time, skipping the repo write when either is unset.

| # | Decision | Choice | Alternative considered |
|---|---|---|---|
| 27 | Repo resolution | Auto from the installation: the `/github/installed` redirect resolves accessible repos via a short-lived installation token - persist automatically when exactly one, else hand off to a picker page | Manual owner/repo entry field - avoided mismatches with what the App is actually installed on |
| 28 | Install callback gate | The callback requires an Auth.js session and verifies the installation's account is a `User` whose login matches the signed-in user (orgs rejected until admin verification ships); an optional signed `state` nonce binds our own install link to the user | Trusting the callback's `installation_id` directly - left a cross-account installation-hijacking hole |

## 2026-07-27 - Web dashboard rebuild in the locked design (issue #27)

Implemented the axi.md design tokens from `docs/DESIGN.md` and the signed-off `docs/design/ui-direction.html` mockup in `apps/web`.

| # | Decision | Choice | Alternative considered |
|---|---|---|---|
| 29 | Token delivery | Palette/typography/radius/shadow encoded as CSS variables (`globals.css`) plus `tailwind.config.ts` theme extensions | Hardcoding the mockup's utility classes - would drift from the locked tokens and block reuse in the plugin popup |
| 30 | Dashboard data | Stats row and revision queue derived from real `SubmissionSummary` fields (`isMarkedForRevision`, `pattern`, `solvedAt`); the AI Insight card states insights land once the SRS revision engine (issue #31) ships | Fabricating placeholder numbers to match the mockup - would misrepresent product state |
| 31 | Non-mockup sections | Existing GitHub-connect banner and extension-token sections (not in the mockup) kept and restyled with the same tokens below the redesigned shell | Dropping them to match the mockup exactly - both are still-needed, shipped features |

## 2026-07-27 - Problems screen: sync status, capture status, code view (issue #40)

Designed the Problems screen in a lavish session (`.lavish/problems-screen.html`) and signed off, then implemented it in `apps/web`.

| # | Decision | Choice | Why |
|---|---|---|---|
| 32 | Sync status is a real field, not cosmetic | `Submission.repoPath` is only set when the GitHub commit actually succeeds; `SubmissionSummary.synced = repoPath !== null`. Previously `repoPath` was always set to the slug even when the repo write was skipped (no installation wired), which would have made "Synced" lie | Discovered while implementing the mockup's Sync column - an honest per-row signal requires fixing the underlying bug, not just displaying whatever was there |
| 33 | No Status (accepted/wrong/tle) column | Dropped from the design | Confirmed in `apps/extension/lib/leetcode.ts` that capture only ever sends `status: "accepted"` for `statusDisplay === "Accepted"` submissions - every row is already accepted, so the column had nothing to show |
| 34 | Code view is read-only, fetched from GitHub | New `GET /submissions/:id/code` reads back `solution.<ext>` via the existing `readSubmissionFiles` helper and renders it in a plain `<pre>` (no editor library added) | GitHub stays the source of truth; view-only avoids introducing a second place solutions can be edited |
| 35 | Filtering/sorting server-side, pagination client-side over the filtered set | `GET /submissions` gained optional `platform/level/pattern/language/synced/q/sortBy/sortOrder` query params, still returning a plain array (unpaginated); the Problems page slices it into pages of 25 | Keeps the overview's unfiltered full-list fetch (streak/pattern stats) working unchanged; avoids a dual response-shape endpoint for what is, per user, a modest dataset |
| 36 | Manual "Add problem" entry deferred | Filed as a separate issue (#44), not folded into #40 | User asked for it mid-review; it's a capture path (PRD's manual-form fallback), not a Problems-screen read/filter concern, and needs entry points on both Overview and Problems |

## 2026-07-27 - Manual "Add problem" entry (issue #44)

Designed in a lavish session, then implemented, delivering the manual capture path deferred at decision #36 and superseding decision #34's read-only `<pre>` code view.

| # | Decision | Choice | Why |
|---|---|---|---|
| 37 | Manual entry posts through the existing capture path | `/problems/new` form builds a `CaptureSubmission` and posts it to the same `POST /submissions` endpoint the extension uses, rather than a dedicated manual-entry endpoint | One capture ingestion path for both the extension and the manual form avoids divergent validation/enrichment behavior |
| 38 | Manual-entry language select defaults to Java | `apps/web/src/app/problems/new/AddProblemForm.tsx` | Reviewer feedback in the lavish session |
| 39 | Code view (submission page) and code entry (new-problem form) share one CodeMirror 6 component | Added `apps/web/src/app/CodeEditor.tsx`; the read-only `CodeViewer` and the editable `AddProblemForm` both render it, replacing the plain `<pre>` from decision #34 | Reviewer feedback in the lavish session; keeps syntax highlighting and styling in one place instead of duplicating a code surface |
| 40 | Editor background is `#1b1b1b` | Changed from an initial `#1e1c19` in `CodeEditor.tsx`'s theme | Reviewer feedback: better text contrast |

## 2026-07-27 - Avatar/profile menu (issue #43)

Designed in a lavish session (`.lavish/avatar-profile-menu.html`) against a dark generic-SaaS reference screenshot the user shared, then implemented.

| # | Decision | Choice | Why |
|---|---|---|---|
| 41 | Reference screenshot's content, not its skin | Kept what to include (account info, GitHub repo status, extension token, sign out) from the reference; rejected its dark theme/settings-page look in favor of our locked axi.md system | Design tokens are locked (docs/DESIGN.md); the reference was functional inspiration only |
| 42 | Avatar opens a dropdown, not a dedicated settings page | `AvatarMenu.tsx`, a client component anchored under the avatar | User confirmed in review: ship the lighter dropdown now, revisit a full `/settings` page later if needed |
| 43 | The two standalone "GitHub repo" / "Extension token" cards are removed from the homepage | Folded into the dropdown instead; `TokenField.tsx` deleted as no longer used | User confirmed in review - avoids duplicating the same status/actions in two places |
| 44 | GitHub "Disconnect" action deferred | Filed as a separate issue (#47), not built now | Reference screenshot had a danger-zone disconnect but no backend support exists yet; user asked for it as a follow-up |
| 45 | Header data (token, GitHub repo status, install URL) centralized in `getHeaderData()` | New `apps/web/src/lib/header-data.ts`, used by all four pages that render `DashboardHeader` | Avoids duplicating the same session/Prisma/JWT lookups across the overview, problems, add-problem, and code-view pages |
