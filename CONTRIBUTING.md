# Contributing to ShekseCodeSync

Thanks for considering a contribution. This is a young project, so the process is deliberately lightweight - the goal is to keep quality high without adding ceremony.

## Before you start

- **Check open issues first**: [Issues](https://github.com/seemantshekhar43/shekse-code-sync/issues) are the source of truth for what's planned and what's already done (open = backlog, closed = done). If your idea isn't there, open an issue to discuss it before writing code - this avoids wasted work on something that doesn't fit the roadmap.
- For anything beyond a small fix (new feature, schema change, architecture change), open an issue describing the problem and your proposed approach, and wait for a thumbs-up before starting.
- Read `CLAUDE.md` (also readable as `AGENTS.md`) for the project's working conventions, and `docs/` for product/architecture context:
  - [`docs/PRD.md`](docs/PRD.md) - product requirements
  - [`docs/TECH_STACK.md`](docs/TECH_STACK.md) - stack + rationale
  - [`docs/DECISIONS.md`](docs/DECISIONS.md) - decision log

## Reporting bugs

Open a [GitHub issue](https://github.com/seemantshekhar43/shekse-code-sync/issues/new) with:

- What you did, what you expected, what happened instead.
- Steps to reproduce, and which app/package it's in (`extension`, `api`, `worker`, `web`, or a shared package).
- Logs, screenshots, or a stack trace if you have one.

## Suggesting features

Open an issue describing the problem you're trying to solve (not just the solution) - it makes it easier to discuss alternatives. Feature ideas that aren't yet scoped live in [`docs/FEATURE_IDEAS.md`](docs/FEATURE_IDEAS.md); feel free to add to it.

## Development setup

See [Getting started (local dev)](README.md#getting-started-local-dev) in the README for installing dependencies, environment variables, and running the stack locally.

## Making changes

1. Fork the repo and branch off `main`: `git checkout -b feat/<short-description>`.
2. Make your change. Keep commits focused and messages descriptive.
3. Add or update tests alongside the code you change (see [Testing](README.md#testing) in the README for conventions).
4. Before opening a PR, make sure the workspace is clean:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```
5. If your change touches the web dashboard or extension UI, verify it in a real browser - don't rely on typecheck/tests alone for UI correctness.
6. Push your branch and open a pull request against `main`. Reference the related issue (e.g. `Closes #123`) in the PR description.
7. CI must pass before a PR is merged. A maintainer will review and may ask for changes.

## Code style

- TypeScript everywhere; run `pnpm lint` and `pnpm format` before committing.
- Co-locate unit tests next to source as `*.test.ts`.
- No em dashes in code, comments, or docs - use a plain dash.
- Don't hand-edit generated files (Prisma client, `CHANGELOG.md`, etc.).

## Code of conduct

Be respectful and constructive. Disagreements about technical direction are fine and expected; personal attacks are not. Maintainers may close issues or PRs that don't follow this.

## Questions

Open a [discussion or issue](https://github.com/seemantshekhar43/shekse-code-sync/issues) - there's no separate mailing list or chat yet.
