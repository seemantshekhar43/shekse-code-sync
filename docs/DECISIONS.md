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

## 2026-07-27 - Revision engine (SRS): scheduler + queue API (issue #31)

Built the SRS half of the `RevisionAttempt` model that already existed on paper: a real scheduler, a way to mark/rate submissions, and the Overview rail wired to actual due dates instead of a raw `isMarkedForRevision` list.

| # | Decision | Choice | Why |
|---|---|---|---|
| 46 | Scope boundary vs #41/#42 | Kept #31 to the SRS scheduler, `POST /revisions` + `GET /revisions/queue`, and wiring real due-item data into the existing Overview rail/stat/rating UI - no dedicated Revision or Insights routes | Both #41 and #42 explicitly defer their own lavish-designed screens until #31 ships with real data; building them now would preempt their design sign-off |
| 47 | Scheduling algorithm | Classic SM-2 (Anki): `apps/api/src/revisions/srs.ts` - quality 0-5, ease floored at 1.3, interval resets to 1 day on quality &lt; 3, otherwise 1 → 6 → `round(prevInterval * ease)` | Matches the PRD's "Anki-style" spaced repetition call-out and the schema's existing `ease`/`intervalDays` fields; a well-known algorithm needs no bespoke tuning |
| 48 | Revision-flag toggle added to Problems screen | New `PATCH /submissions/:id/revision-flag`, a "Mark"/"Marked" button per row | Discovered while implementing #31 that nothing set `isMarkedForRevision` anywhere - it defaults `false` and the revision queue would always be empty without a way to flag a submission |
| 49 | Rating UI lives on the Overview rail, not a dedicated screen | `RevisionQueueRail.tsx` client component with Again/Hard/Good/Easy buttons calling `POST /revisions` | #31's acceptance criterion is "a user can rate a revision" - since the dedicated Revision screen is #41's job, the rating action needed a temporary home to make the feature end-to-end usable now |
| 50 | AI Insight card copy updated | Now points at the dedicated Insights screen (#42) instead of "the revision engine" | The revision engine has shipped but real insights-aggregation is still #42's explicit scope, not #31's |

## 2026-07-28 - Dedicated Revision screen (issue #41)

Built the `/revision` screen signed off in lavish (`.lavish/revision-screen.html`), segmenting the full revision queue into Due now / Due soon (next 3 days) / Upcoming.

| # | Decision | Choice | Why |
|---|---|---|---|
| 51 | New `RevisionsService.fullQueue()` + `GET /revisions/full-queue` | Returns every `isMarkedForRevision` submission regardless of due date; `apps/web/src/lib/revision-segments.ts` segments client-side | `GET /revisions/queue` only ever returns overdue-or-never-rated items (needed as-is by the Overview rail); the dedicated screen needs the full set to show due-soon and upcoming buckets too |
| 52 | Added "Remove from queue" action per card/row | Reuses the existing `PATCH /submissions/:id/revision-flag` endpoint - the same one the Problems screen "Mark"/"Marked" toggle calls | SM-2 never drops an item out of the queue on its own, it just keeps rescheduling `dueAt`; user asked for a way to graduate a problem out and approved reusing the existing flag endpoint instead of adding a new one |
| 53 | `RevisionQueueItem` extended with `ease`, `intervalDays`, `questionLink` | Added to `packages/types/src/index.ts` | `ease`/`intervalDays` needed for due-soon/upcoming card metadata; `questionLink` makes problem titles link out to LeetCode/NeetCode like the Problems screen, a gap caught after the user asked what clicking a card does |

## 2026-07-28 - Dedicated Insights screen (issue #42)

Built the `/insights` screen signed off in lavish (`.lavish/insights-screen.html`); the design changed shape mid-review based on live user feedback.

| # | Decision | Choice | Why |
|---|---|---|---|
| 54 | Full-year calendar heatmap instead of a weekly trend chart | `CalendarHeatmap.tsx` - GitHub-style grid with month/weekday labels, sequential single-hue green ramp, click-to-drill-down panel (title + difficulty per day) | Initial line/area proposal was rejected live; user pasted a GitHub contribution-calendar reference and asked for that form instead, plus drill-down beyond a hover tooltip |
| 55 | Difficulty mix stays a bar chart with direct text labels, not a pie/donut | Ran the locked green/amber/red difficulty palette through the dataviz skill's colorblind validator - came back borderline (red/amber normal-vision floor just under threshold) | A donut is the wrong form for comparing close values regardless; bar + labels mitigates the borderline contrast without touching the locked tokens (docs/DESIGN.md) |
| 56 | AI-insight bullets are rule-based, not LLM-generated, for this issue | `apps/web/src/lib/insights-observations.ts`; LLM-generated version filed as a follow-up (#51, needs a caching strategy to avoid a live model call per page view) | User was asked directly and chose rule-based now to keep #42 scoped and avoid the caching problem |
| 57 | Streaks computed over all-time data, independent of the viewed `?year=` | `InsightsService` in `apps/api/src/insights/insights.service.ts` | A streak that reset at a year boundary would misrepresent an actual ongoing streak spanning New Year's |

## 2026-07-28 - Disconnect GitHub action (issue #47)

Added the danger-zone "Disconnect" action deferred out of #43/#48, signed off in lavish (`.lavish/disconnect-github.html`).

| # | Decision | Choice | Why |
|---|---|---|---|
| 58 | "Disconnect" clears our DB association AND best-effort revokes the GitHub App installation | `disconnectInstallation()` in `apps/web/src/lib/github-install.ts` calls the new `uninstallInstallation()` in `packages/github`, then nulls `githubInstallationId`/`githubRepo` regardless of whether the GitHub call succeeded | User confirmed in lavish review; the DB write is the source of truth so a revoke failure (already uninstalled, transient error) never blocks the local disconnect |
| 59 | Inline confirmation row instead of a modal | `AvatarMenu.tsx` swaps the GitHub-repo section into a Cancel/Disconnect row on click, no dialog component | No modal component exists anywhere in the codebase yet; user confirmed in lavish review that building one wasn't worth it for a single confirmation |
| 60 | Disconnect also invalidates the extension token | Added `User.tokenVersion` (default 0); `mintScsToken` embeds it as the `ver` claim, `verifyScsToken` (apps/api) now checks it against the DB, and `disconnectInstallation` increments it | User asked mid-implementation: the extension token was a stateless, non-revocable 365-day JWT (revocation was "rotate the shared secret" for everyone) - a per-user version claim makes disconnect actually invalidate the specific token without touching anyone else's |

## 2026-07-28 - Production deployment topology

Designed in a lavish session (`.lavish/deployment-topology.html`, gitignored working doc) and signed off, covering where each service runs and how traffic reaches the homelab.

| # | Decision | Choice | Why |
|---|---|---|---|
| 61 | Container packaging unchanged for prod | `worker` stays a separate container from `api`; `postgres` stays its own container on the same homelab LXC, in the same `docker-compose.yml` as `api`/`worker`/`redis` - only `web` peels off to Vercel | Matches what's already built; separate `worker` isolates AI-call/queue failure domains from the capture API, and a dedicated data-services LXC has no benefit yet at single-app scale |
| 62 | Homelab ingress via existing Caddy + Cloudflare Tunnel | Route `api.yourdomain.com` through the Caddy reverse proxy and `cloudflared` already running on a separate edge LXC (one new Caddyfile block + one new tunnel hostname), not a new `cloudflared` container in the app stack and not a router port-forward | Reuses infrastructure the user already operates for other self-hosted services; port-forward would expose a home IP directly |
| 63 | Dashboard-to-API calls need no CORS handling | Verified `apps/web/src/lib/*-api.ts` calls all run inside Next.js Server Actions/components (`"use server"`) - Vercel's server calls the homelab API directly, the browser never makes that request | Confirms `web` and `api` living on different domains (Vercel vs. the homelab subdomain) is the existing designed shape, not a workaround |
| 64 | CORS on `api` to be scoped to the extension's real origins | `app.enableCors()` in `apps/api/src/main.ts` is currently allow-all; tighten to `chrome-extension://<id>`/`moz-extension://<id>` once the published extension ID is stable (tracked in the deployment checklist, not yet implemented) | The extension is the only real cross-origin caller of `api`; auth is a bearer JWT not a cookie so allow-all isn't a security hole today, but scoping it is still the right prod posture |
| 65 | Prod GitHub OAuth App + GitHub App registered separately from local dev | New credentials at prod callback/Setup URLs, stored as Vercel env vars (`web`) and the homelab `.env` (`api`) - never reuse dev credentials | Keeps prod secrets isolated from whatever's used for local development |
| 66 | Postgres backups: two copies | Nightly dump to the HDD attached to the homelab, plus an off-site copy to Google Drive | Matches the pattern the user already runs for other self-hosted DBs |

## 2026-07-28 - Docker stack validation (issue #32)

`docker compose up --build` had never been exercised end-to-end; running it surfaced 4 real bugs, fixed on `apps/api/Dockerfile`, `apps/worker/Dockerfile`, and `docker-compose.yml`.

| # | Decision | Choice | Why |
|---|---|---|---|
| 67 | api/worker containers run TS via `@swc-node/register`, not `tsx` | `CMD` switched to `node --import @swc-node/register/esm-register src/main.ts` | `tsx` isn't installed anywhere in the repo; local dev already runs `@swc-node/register` via `pnpm dev`, so the container now matches the same runtime instead of depending on an uninstalled tool |
| 68 | `web`'s Dockerfile installs `openssl` before `pnpm --filter @scs/db generate` | Same `apt-get install -y openssl ca-certificates` step `api`/`worker` already had | Prisma's `generate` picks its query-engine binary based on the OpenSSL variant present at generate time; without it, the engine built couldn't find `libssl` at container runtime |
| 69 | `web`'s compose service gets its own `DATABASE_URL` pointed at the `postgres` service | Added to `docker-compose.yml`'s `web` environment, matching `api`/`worker` | `web`'s `auth.ts` queries Prisma directly for the NextAuth user upsert; without this it silently fell back to `.env`'s localhost value, which doesn't resolve inside the container |
| 70 | `web`'s compose service sets `AUTH_TRUST_HOST: "true"` | Added to `docker-compose.yml`'s `web` environment | `next start` runs Auth.js in production mode, which requires explicit trust of the request `Host` header; `next dev` trusts localhost implicitly, so this only surfaced once containerized |

Verified by building and running all 5 services, signing in through real GitHub OAuth against the containerized `web` app, and driving a real Add-problem capture through `api` -> `postgres` -> `redis` -> `worker` end to end via `chrome-devtools-axi`.

Also noted, not fixed (a local machine constraint, not a repo bug): `docker compose build` must run per-service rather than for the whole stack at once, since building `api`/`worker`/`web` concurrently OOMs a Docker Desktop VM with ~2GB allocated.

## 2026-07-28 - CI image-build workflow, GHCR, and branch protection (issue #58)

Follow-up from the deployment-topology checklist (`.lavish/deployment-topology.html`).

| # | Decision | Choice | Why |
|---|---|---|---|
| 71 | New `.github/workflows/build-images.yml`, separate from `ci.yml` | Matrix build over `[api, worker]`, triggers only on push to `main`, pushes to `ghcr.io/<owner>/scs-api` and `scs-worker` tagged `latest` + long commit SHA | Keeps the existing PR-time `ci.yml` (typecheck/lint/test) untouched and fast; image builds only need to run on merge, not every PR push |
| 72 | `docker-compose.yml`'s `api`/`worker` services gained an `image:` key alongside their existing `build:` key | `image: ghcr.io/seemantshekhar43/scs-api:latest` (and `scs-worker`) | `docker compose pull` needs a named image to pull; `build:` alone only supports local building. Keeping both means local dev still builds from source (`docker compose up --build`) while the homelab can just `docker compose pull && docker compose up -d` |
| 73 | Branch protection on `main` not applied | Attempted via `gh-axi api PUT .../branches/main/protection`, got `403 Insufficient permissions` | Classic branch protection rules on a **private** repo require GitHub Pro/Team; this repo is on a free personal-account plan. Tracked as blocked in `PRODUCTION_CHECKLIST.local.md` - revisit if the repo goes public or the plan is upgraded |
| 74 | Homelab pull step documented in README, not scripted | New "Deploying `api`/`worker`" section in `README.md`: `docker compose pull api worker && docker compose up -d api worker` | Matches the project's "start simple, automate only if it becomes friction" convention from the deployment-topology decision; no Watchtower or auto-deploy agent added |

## 2026-07-28 - NeetCode descoped as a capture platform (issue #62)

| # | Decision | Choice | Why |
|---|---|---|---|
| 75 | Drop `neetcode` from the `Platform` enum and all product code/docs; keep only `leetcode` + `manual` | `Platform` enum in `packages/db/prisma/schema.prisma` and `packages/types/src/index.ts` reduced to `leetcode` / `manual`; matching UI (Problems filters, platform column, Add-problem form) and docs (README, PRD, CLAUDE.md, FEATURE_IDEAS) updated to match | NeetCode capture was never actually implemented and isn't in current scope; row 3 above (2026-07-25) is left as-is since it reflects what was decided at launch time - this entry supersedes it going forward. Dev-only DB, so the enum value was dropped via a clean migration rather than a backfill |

## 2026-07-28 - GHCR image retention and tag-cut release workflow (issue #64)

| # | Decision | Choice | Why |
|---|---|---|---|
| 76 | Keep only the 3 most recent versions per GHCR package | `actions/delete-package-versions` step added to `build-images.yml` and mirrored in the new `release.yml`, `min-versions-to-keep: 3` for `scs-api` and `scs-worker` | Bounds GHCR storage growth from every merge and every tagged release without needing a separate cleanup job |
| 77 | New `.github/workflows/release.yml` triggers on a `v*.*.*` tag push, builds version-tagged images, and creates a GitHub Release whose body is GHCR `docker pull` commands only - no docker-save tarballs attached | Matrix build over `[api, worker]`, then `softprops/action-gh-release` with `docker pull ghcr.io/.../scs-{api,worker}:${{ github.ref_name }}` in the notes | Confirmed with the user: GHCR is already the distribution channel `docker-compose.yml` pulls from, and tarball release assets would duplicate storage for no benefit, plus hit GitHub's 2GB-per-file release-asset limit |
| 78 | Moved README's in-progress "Status" section to a new `docs/STATUS.md`, linked from README | Build state / done-so-far / next-up content relocated verbatim; README's Docker-images section gained a paragraph on tag-triggered releases and the 3-version retention | Keeps README focused on what the project is and how to use it, not development-in-progress tracking |

## 2026-07-29 - Web no longer talks to Postgres directly (issue #66)

Prerequisite for the Vercel migration in the production-deployment checklist. Surfaced while starting that work: `web` imported `@scs/db` and queried Postgres directly from four call sites (NextAuth upsert, GitHub-install persist/disconnect, token-version read, header-data read), which only worked because `web` and `postgres` share a Docker network locally. Once `web` moves to Vercel, that would mean either exposing Postgres to the public internet (real attack surface) or hitting the classic serverless connection-exhaustion problem against a single Postgres instance - both avoidable.

| # | Decision | Choice | Why |
|---|---|---|---|
| 79 | New `InternalAuthGuard` (`X-Internal-Secret` header, new `INTERNAL_API_SECRET` env var) gates a `UsersModule` on `api` at `/internal/users/*` | `apps/api/src/auth/internal-auth.guard.ts`, `apps/api/src/users/*` | A separate trust boundary from `ScsAuthGuard` (end-user bearer tokens) - `INTERNAL_API_SECRET` is shared only between `web` and `api`, never the extension or browser |
| 80 | `web`'s four Prisma call sites replaced with calls through `apps/web/src/lib/internal-api.ts` | `auth.ts`, `github-install.ts`, `scs-token.ts`, `header-data.ts` | Only `api` needs a network path to Postgres now; `web` can run anywhere (Vercel) with no DB reachability requirement |
| 81 | `@scs/db` dropped from `apps/web`'s dependencies; Prisma-generate step and the `openssl` install it required dropped from `apps/web/Dockerfile`; `DATABASE_URL` dropped from `web`'s `docker-compose.yml` service | Matches what `docs/TECH_STACK.md`'s monorepo shape and the README's architecture diagram already documented (`packages/db` "shared by api + worker" only) - this closes a gap between that and the actual code, superseding decision #69 | Removing the now-unused DB wiring rather than leaving it dormant avoids a stale `DATABASE_URL` silently working locally while being wrong in prod |
| 82 | Disconnect now clears the DB association before best-effort revoking the GitHub App installation (previously the other order) | `disconnectInstallation()` in `github-install.ts` calls the new `/internal/users/:id/disconnect` endpoint (which returns the previous installation id) first, then calls `uninstallInstallation` | The DB clear and the GitHub revoke can no longer happen in one process/transaction across the network boundary; DB is the source of truth for "connected", and the GitHub call was already best-effort/non-blocking, so this ordering change has no user-visible effect |
