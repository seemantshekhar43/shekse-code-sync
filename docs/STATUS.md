# Project Status

Monorepo scaffolded and green in CI; first MVP read-path slice done.

Work is tracked as GitHub issues; **open issues are the backlog, closed issues are done**.

```bash
gh issue list --state open      # what's next
gh issue list --state closed    # what's done
```

Done so far: PRD + tech stack signed off, monorepo scaffolded (apps + shared packages, Docker, CI), read-path MVP slice (list submissions), capture write-path MVP slice (commit each problem to the user's GitHub repo on capture, GitHub as source of truth), AI-analysis slice (worker reads the statement + solution back from GitHub and writes complexity/pattern/optimization notes), web dashboard rebuilt in the locked axi.md design, Problems screen (filterable/sortable/paginated submissions grid with per-row GitHub sync status and a read-only code viewer), manual "Add problem" entry point, SRS revision engine (SM-2 scheduler, `POST /revisions` rating + `GET /revisions/queue`, Overview rail wired to real due dates), dedicated Revision screen (`GET /revisions/full-queue`, due-now/soon/upcoming segments, remove-from-queue action), dedicated Insights screen (`GET /insights?year=`, full-year calendar heatmap with click-through, difficulty mix, pattern coverage, streaks, rule-based AI observations). Next up (open issues): LLM-generated AI insights (#51), live end-to-end tests.

See also:

- [Product Requirements](PRD.md)
- [Tech Stack](TECH_STACK.md)
- [Decision Log](DECISIONS.md)
- [Design Direction](DESIGN.md)
- [Feature Ideas (v2+ candidates)](FEATURE_IDEAS.md) - draft brainstorm for review
