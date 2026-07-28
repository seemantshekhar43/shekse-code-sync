# ShekseCodeSync — Product Requirements

> Status: signed off (2026-07-25). Interactive version: `.lavish/shekse-code-sync-prd.html`.

## Vision

Every DSA problem you solve on LeetCode leaves a durable, enriched, revisitable trace — with effectively zero manual bookkeeping.

**Problem today:** solved problems vanish into platform history; solutions aren't version-controlled; patterns/weaknesses live only in your head; revision is ad-hoc; no single view of progress.

**What ShekseCodeSync gives you:** zero-effort capture, a GitHub repo that doubles as a browsable DSA portfolio, an AI reviewer (complexity + pattern + optimization), a revision engine that targets your weaknesses, and a dashboard that answers "how am I doing?" at a glance.

## The five pillars

1. **Capture** — browser plugin auto-grabs each submission; manual form fallback.
2. **Store** — question & code in GitHub; metadata indexed in a DB.
3. **Analyze** — AI grades complexity, tags topics, names patterns, suggests optimizations.
4. **Revise** — smart question banks & quizzes by topic, level, pattern, weakness.
5. **Visualize** — dashboard, filters, progress streaks & insights.

## What we capture & where it lives (two-tier storage)

**GitHub repo (content, source of truth)** — one folder per question, named by title:

```
two-sum/
  question.md      # full statement
  solution.py      # code per language (solution.<ext>)
  solution.java
  meta.json        # metadata mirror for portability
```

**Database (queryable index)** — powers dashboard filtering, insights, revision selection; points back to GitHub paths.

| Field | Source | Notes |
|---|---|---|
| title, questionLink, platform, level | capture | platform = leetcode / manual |
| tags, topics, companies, language | capture | tags/topics also AI-enriched; companies if available |
| runtime, memory, status, solvedAt, attemptCount | capture | status = accepted / wrong / TLE |
| isMarkedForRevision | user | revision flag |
| timeComplexity, spaceComplexity, pattern, optimizationNotes | AI | Big-O, e.g. sliding-window |
| repoPath | system | link to GitHub folder |

## Feature detail

- **Capture** — auto mode (extension detects accepted submission and scrapes title, statement, code, language, difficulty, tags/topics, companies, link, runtime/memory), a "Pull & Send" popup, and a manual web form. De-dupes on re-submit.
- **AI analysis** — complexity review, auto-metadata, optimization scan, pattern attribution. Runs async after capture; re-runnable on demand.
- **Revision engine** — question banks by `isMarkedForRevision`, weakness/loophole, topic, level, or mixed. Quiz mode. Weakness targeting via attemptCount / wrong-first / low self-rating. Spaced repetition (Anki-style) in v2.
- **Dashboard** — filter by topic, tag, date, level, pattern, platform, revision flag. Progress header (today / week / month, streak, difficulty split). Insight cards (strong/weak topics, pattern coverage, hardest problems, consistency heatmap).
- **Manual entry** — form + markdown editor for the question + language/code editor; same downstream pipeline.

## Auth & GitHub connection

Core principle: the browser plugin **never** holds GitHub credentials and never talks to GitHub directly — it only talks to our backend using a ShekseCodeSync token.

Two auth boundaries:
1. **Plugin ↔ backend** — plugin holds a ShekseCodeSync token (issued at sign-in / from the dashboard).
2. **Backend ↔ GitHub** — a **GitHub App** each user installs on their chosen repo once during web onboarding. The backend stores the installation ID (encrypted) and mints short-lived per-commit tokens.

Chosen over OAuth App / PAT for fine-grained, per-repo, revocable, short-lived tokens. Self-hosting: the deployer registers one GitHub App per instance (App ID + private key in config).

## Roadmap

- **MVP** — plugin captures LeetCode → GitHub + DB; basic list dashboard; manual form.
- **v1** — AI complexity/pattern/optimization; filterable dashboard; progress header & insight cards.
- **v2** — revision banks, quiz mode, spaced repetition, weakness targeting, more platforms.

## Risks

- LeetCode scraping fragility (DOM/API changes; companies data premium-gated).
- GitHub write path rate limits & commit volume (auth resolved via GitHub App).
- AI accuracy & cost — need review/override + caching.
- Two-tier consistency — GitHub and DB can drift; need reconcile/sync + idempotent writes.
