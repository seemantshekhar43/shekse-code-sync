# ShekseCodeSync — Feature Ideas (v2+ candidates)

> Status: **DRAFT for review** (2026-07-27). Not signed off, nothing built. A brainstorm to read, cut, and prioritize. Once you pick a set, each becomes a GitHub issue (source of truth) and, where it's a real design/scope decision, a lavish artifact + a `DECISIONS.md` entry per the working pattern.

The two things you called out — **(a) get better at DSA by building real pattern-recognition skill**, and **(b) curated "famous sheets" as a tracked question bank** — are the spine of this doc (themes A and B). Everything else hangs off them.

Each idea notes: what it is · why it serves the goal · rough data/impl shape · a rough size (S/M/L). Sizes are relative effort, not calendar.

---

## Guiding lens

Two audiences, and they're mostly the same person:

- **You, getting better** — the product should actively *train pattern recognition* and *close weaknesses*, not just record what you already did. Recording is table stakes; the differentiator is the feedback loop.
- **Other people adopting it** — adoption comes from (1) zero-effort capture (already the thesis), (2) recognizable curated sheets people already trust (Blind 75, Striver), and (3) a shareable portfolio that makes the tool feel worth keeping.

Design principle to hold: **every feature should either capture effortlessly, or force active recall.** Passive dashboards look nice but don't build skill. The revision/quiz/pattern-drill surfaces are where the actual skill gain lives.

---

## A. Curated problem sheets as a question bank (your headline ask)

The idea: ship a catalog of the well-known lists, auto-match them against what you've already solved, and track completion. This is the single most requested-by-you feature and probably the biggest adoption driver, because people search for "Blind 75 tracker" directly.

### A1. Sheet catalog (seed data) — **M**
Ship a curated, versioned catalog of famous sheets as static seed data in the repo (so it's diffable and self-hostable, consistent with "GitHub is source of truth"):

- **Blind 75**
- **Grind 75 / Grind 169** (with its week-by-week schedule — that schedule is itself a feature, see A5)
- **Striver's SDE Sheet** and **Striver A2Z DSA** (huge in the India/LeetCode crowd)
- **LeetCode Top Interview 150** / **Top 100 Liked**
- **Sean Prashad's Leetcode Patterns** (already pattern-tagged — pairs perfectly with theme B)
- **AlgoMonster / company lists** (optional, licensing-sensitive — see risk below)

Each sheet entry is a canonical problem reference (title, LeetCode slug, difficulty, the sheet's own topic/pattern tag, and order/section). Store as JSON/YAML under `packages/db/seed/sheets/` or `docs/sheets/`, loaded into DB tables at migrate/seed time.

**Data shape (sketch):**
```
Sheet         { id, key, name, description, source, sortStrategy }
SheetProblem  { id, sheetId, order, section, canonicalSlug, title, level, patternTag }
```
`Submission` already has `slug` + `questionLink`; matching is on a **normalized LeetCode slug**.

### A2. Auto-match solved → sheet progress — **M**
When a submission lands (or on a reconcile pass), match its normalized slug against `SheetProblem.canonicalSlug`. Then every sheet has live progress for free: "**47 / 75** Blind 75 · 12 easy / 28 med / 7 hard done." No manual ticking — this is the zero-effort thesis applied to sheets.

Edge: slug normalization (leetcode.com/problems/two-sum variants vs renamed problems). Keep an alias map in the seed data for the few that drift.

### A3. Sheet progress dashboard — **M**
A **Sheets** screen (new top-nav item next to Overview/Problems/Revision/Insights): one card per sheet with a completion ring, difficulty split, and "next unsolved" CTA. Drill into a sheet → the ordered checklist, each row linking to either your solved solution (GitHub) or the problem (if unsolved). Uses the locked axi.md tokens; completion ring in green accent.

### A4. "What's next" recommender — **S**
Given a chosen sheet + your history, surface the next problem to attempt: next unsolved in the sheet's canonical order, or (better) biased toward a weak pattern (ties into theme B). One-click "start this next."

### A5. Scheduled sheets (Grind-style plan) — **S/M**
Grind 75 ships as a *week-by-week schedule*. Let a user "start" a sheet with a target pace (e.g. 8 problems/week) and get a generated plan + gentle "you're 2 behind this week" nudge on the dashboard. Turns a static list into a commitment device.

### A6. Custom / shared sheets — **M** (later)
Let a user define their own sheet (drag problems in) or import someone's public list. Because sheets are just seed JSON, a user-authored sheet is the same shape — a natural extension once the catalog exists.

> **Risk / licensing note:** problem *statements* stay on LeetCode (we only reference them). Sheet *membership* (which problems are on Blind 75) is factual/short and widely mirrored, but attributions should be preserved and anything explicitly proprietary (paid course orderings) approached carefully. Reference, don't rehost.

---

## B. Pattern-recognition training (your other headline ask)

The AI already tags a `pattern` per solved problem. Today that's a passive label. The goal is to turn it into an *active skill-building loop*: help you look at a cold problem and think "this is a monotonic-stack problem" before you write a line.

### B1. Canonical pattern taxonomy — **S** (foundation for the rest)
Right now `pattern` is a free-text string from the AI, so "sliding window" / "Sliding Window" / "sliding-window" don't aggregate. Define a fixed enum/catalog of ~20-25 canonical patterns (sliding window, two pointers, fast/slow pointers, binary search, BFS, DFS, backtracking, DP-1D, DP-2D/grid, DP-knapsack, intervals, monotonic stack, heap/top-k, trie, union-find, topological sort, greedy, bit manipulation, prefix sum, matrix traversal, linked-list manipulation, math/number theory, design). Have the AI **map to** this taxonomy (constrained output) instead of inventing labels. Everything else in theme B depends on this normalization.

### B2. Pattern coverage map — **S/M**
A view: each pattern with count solved, difficulty spread, last-touched date, and a mastery indicator (see B4). Instantly shows "I've done 22 sliding-window but only 2 union-find." This is the "where am I weak" picture, by pattern rather than by topic.

### B3. "Guess the pattern" drill — **M** (highest skill-per-effort idea in the doc)
Active-recall quiz: show a problem statement (from your solved history, or a sheet entry), you pick the pattern from the taxonomy *before* revealing the AI's answer. Score it. This directly trains the exact skill you asked for — recognizing the pattern from the prose. Track accuracy over time as its own metric. Cheap to build on top of B1 + existing statements in GitHub.

### B4. Pattern mastery score — **M**
Per pattern, derive a 0-100 mastery from: # solved, difficulty, first-attempt success, re-solve success in SRS, and "guess the pattern" accuracy. Drives the recommender (A4), the drills, and the weakness targeting the PRD already promises. Keep the formula simple and legible (no black box).

### B5. Pattern drill sets — **S/M**
"Do 5 backtracking problems in a row" — a focused set pulled from a chosen pattern (from your unsolved sheet problems or LeetCode by tag). Blocked practice for a weak pattern, then interleaved practice (mix patterns) once it's warmer — the interleaving is what actually generalizes, so support both modes.

### B6. Pattern "trigger cards" — **S**
For each pattern, an AI-generated (then human-edited) one-card cue: the *signals in a problem statement* that should make you reach for it ("sorted array + find a pair/target → two pointers"; "max/min over every window of size k → sliding window"). Flashcard-style, reviewable in SRS. Turns pattern recognition into memorizable heuristics.

---

## C. Revision / spaced-repetition engine (extends the planned SRS)

The schema already stubs Anki fields on `RevisionAttempt` (issue #31). Ideas that make the SRS actually build skill rather than just resurface titles:

### C1. Cold re-solve mode — **M**
When a card is due, don't show the old solution. Blank CodeMirror editor, optional timer, re-solve from scratch, then **diff against your previous solution** and self-rate (0-5) → drives the interval. Re-solving beats re-reading by a mile for retention. This is the core SRS interaction, not a nice-to-have.

### C2. Leech detection — **S**
Problems you keep failing on re-solve (Anki's "leech" concept) get surfaced in a "these keep beating you" list and pinned to the top of revision + flagged for a pattern drill (B5). Turns repeated failure into a targeted plan.

### C3. Weakness-targeted queue — **S**
The PRD promises "weakness targeting." Concretely: bias the daily revision queue toward low-mastery patterns (B4), low first-attempt-success problems, and hard difficulty. Make the mix visible ("today: 3 due + 2 weak-pattern picks").

### C4. Confidence tagging at capture — **S**
Let a capture carry a quick self-rating ("nailed it / struggled / looked at hints"). Feeds mastery + schedules a struggled-problem into revision sooner. One tap in the popup; big signal for the whole revision engine.

---

## D. Practice, quiz & interview-sim modes

### D1. Problem of the Day — **S**
A daily pick biased toward your weak patterns / due revisions / next sheet problem. The habit hook. Optional streak. Cheap, high retention value.

### D2. Timed mock-interview session — **M**
Pick difficulty/pattern/company, get a random problem, a timer, and a post-session summary (solved? time? pattern guessed right?). Simulates the real pressure the recording-only flow can't.

### D3. Company prep mode — **M**
`Submission.companies` already exists. Filter/practice by company, show coverage against that company's commonly-tagged set, and (with a company-tagged sheet) a "Google-style set" drill. Big for job-seekers — an adoption driver.

### D4. Interviewer follow-up simulation (AI) — **M**
After a solved problem, the AI plays interviewer: "can you do it in O(1) space?", "what if the input is streamed?". Trains the follow-up/optimization muscle interviews actually test. Builds on the existing AI layer.

---

## E. Deeper insights & analytics

Extends the planned insights dashboard (#31/#42).

### E1. Consistency heatmap — **S**
GitHub-style contribution grid of solves over time. Streaks, longest streak, this-week vs last. Already implied by the design's "streak" stat; make it a real calendar heatmap.

### E2. Complexity-progression trend — **S/M**
Track your solutions' time/space complexity over time and per pattern — are your first cuts getting better? "Your DP solutions trend from O(n²) toward O(n) over the last 20." Uses `Analysis` data already captured.

### E3. Strong/weak radar — **S**
Radar or bar of mastery across the pattern taxonomy (B1/B4). The "one-glance where I stand" the PRD's insight cards want.

### E4. First-attempt success & time-to-solve — **S**
`attemptCount` exists; add optional solve-duration capture. Surfaces "you tend to need 2+ attempts on graphs." Honest signal, not vanity metrics.

### E5. AI meta-insights — **M**
Periodic AI pass over your corpus: "you reach for brute force before considering a heap on top-k problems," "your sliding-window window bounds are a recurring bug." Qualitative coaching from the data. Cache aggressively (cost).

---

## F. Portfolio, sharing & motivation (adoption)

### F1. Public portfolio page — **M**
An opt-in public read-only page (`/u/<handle>`) rendering your GitHub-backed DSA history: total solved, sheet completion badges, pattern coverage, streak. Because content already lives in a real GitHub repo, this is "a portfolio that doubles as a repo" — the PRD's own pitch, made shareable. Strong reason for others to adopt.

### F2. Sheet completion badges / achievements — **S**
"Blind 75 ✓", "30-day streak", "First union-find solve." Lightweight gamification tied to real milestones (sheets, patterns, streaks), not busywork.

### F3. Friends / opt-in leaderboard — **M** (later)
Since it's self-hosted + multi-user, an opt-in leaderboard among people on the same instance (or federated by sharing profiles). Motivation without turning it into a vanity treadmill — keep it opt-in and quiet.

---

## G. Capture & content enrichments

### G1. Bulk import of existing history — **M** (big adoption unlock)
Most target users already have hundreds of solved LeetCode problems. A one-time import (from LeetCode's solved/submissions list, or an existing solutions GitHub repo) seeds the whole system so day one isn't empty. Without this, sheets/insights start blank and the tool feels cold. Probably the highest-leverage adoption feature after sheets themselves.

### G2. Multi-language & multi-attempt history — **S/M**
The GitHub layout already allows `solution.<ext>` per language. Track multiple languages and an attempt timeline per problem (diffs over time), so revision can show "how you solved it in Jan vs now."

### G3. Personal notes / "one-line approach" field — **S**
A short editable note per problem ("the trick: two heaps"). Captured or added later, shown in revision, embeddable in trigger cards (B6). The single most useful thing to re-read before a re-solve.

### G4. Editorial capture & comparison — **S/M**
Optionally store the official/editorial approach alongside yours and let the AI diff "your approach vs the canonical optimal." Sharpens the optimization loop.

---

## Cross-cutting: what this implies for the data model

Nothing here fights the current schema; it mostly adds catalog + progress tables and normalizes one field:

- **New:** `Sheet`, `SheetProblem` (catalog, seed-loaded) and a derived/join for user progress (can be computed from `Submission` ∪ `SheetProblem`, no per-user rows needed at first).
- **New:** a `Pattern` catalog/enum (B1) so `Analysis.pattern` maps to canonical values; consider a `patternKey` column alongside the free-text one for a clean migration.
- **Extend:** `RevisionAttempt` is already SRS-ready; add optional `solveDurationSec` / `confidence` to `Submission` or a capture-time field for C4/E4.
- **Derived:** mastery (B4) and sheet progress (A2) are computed, not stored — keep them as query/materialized views so GitHub stays the source of truth.

---

## Suggested prioritization (my recommendation)

If the goal is *your* skill gain + real adoption, and building on the SRS/insights already queued, I'd sequence:

**v2 core (do these first — they compound):**
1. **B1 pattern taxonomy** — unblocks every pattern feature; tiny.
2. **A1–A3 sheet catalog + auto-match + Sheets screen** — your headline ask; also the marquee adoption feature.
3. **C1 cold re-solve SRS** — the actual skill-building loop (pairs with the already-planned #31).
4. **B3 "guess the pattern" drill** — highest skill-per-effort; trains exactly what you asked for.
5. **G1 bulk import** — so sheets/insights aren't empty on day one.

**v2 fast-follow:**
6. B2/B4 pattern coverage + mastery → feeds A4 recommender & C3 weakness targeting.
7. E1/E3 heatmap + pattern radar (rounds out the insights screen #42).
8. D1 Problem of the Day (habit hook).
9. F1 public portfolio (adoption).

**Later / opportunistic:** A5 scheduled sheets, A6 custom sheets, B5/B6 drill sets + trigger cards, D2–D4 interview sims, E2/E5 trend + meta-insights, F2/F3 badges + leaderboard, G2–G4 content enrichers.

**The one-line version:** ship the **pattern taxonomy + famous-sheets tracker + cold re-solve + guess-the-pattern drill**, seeded by a **bulk history import**. That quartet turns the current recorder into something that actively makes you better and that a stranger would want to start using.

---

## Next steps (when you've reviewed)

- Mark which ideas are in / out / later.
- For the "in" set, open a GitHub issue each (source of truth), and put the sheet-catalog + pattern-taxonomy decisions through a lavish artifact before building (they're real scope/design calls), then log them in `DECISIONS.md`.
- Fold the accepted items into the PRD roadmap (§Roadmap currently ends at v2 = revision/quiz/SRS; this expands what v2 means).
