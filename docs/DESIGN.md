# ShekseCodeSync — Design Direction

> Status: **LOCKED** (2026-07-26, issue #14). Signed off in a lavish session. This file is the reference source of truth for design tokens. Visual reference: [`docs/design/ui-direction.html`](./design/ui-direction.html) (open in a browser).

## Aesthetic direction

Inspired by **https://axi.md/** - inspired-by, not a copy. A quiet, typography-forward look: warm paper background, a serif display face, generous whitespace, content-first layout, and **one confident green accent**. Both surfaces - the **browser plugin popup** and the **web dashboard** - share one system; the popup is a compact sibling of the dashboard.

The real axi.md stack (Source Serif 4 display, Inter UI, JetBrains Mono, warm neutral + green palette) was captured and adopted as ShekseCodeSync's own, with amber/red added only to encode Easy/Medium/Hard difficulty.

## Locked tokens

### Color

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F5F2ED` | Page background (warm cream) |
| `surface` | `#ECEAE4` | Cards, panels |
| `surface-2` | `#E2DED7` | Nested / secondary fills |
| `border` | `#D1CCC4` | Hairline borders, dividers |
| `ink` | `#1A1A1A` | Primary text |
| `muted` | `#6B6560` | Secondary text |
| `faint` | `#908A82` | Meta labels, timestamps |
| `green` | `#1A6B5A` | Accent: primary actions, links, "synced", Easy |
| `green-soft` | `rgba(26,107,90,.10)` | Accent tint (badges, insight card) |
| `medium` | `#B4791F` | Medium difficulty, "in-progress" states |
| `hard` | `#B03A2E` | Hard difficulty, "due now" |

Difficulty encoding: Easy = green, Medium = amber (`medium`), Hard = red (`hard`).

### Typography

| Family | Stack | Use |
|---|---|---|
| Display | `"Source Serif 4", Georgia, serif` | Headlines, stat values, section titles (weight 600) |
| UI / body | `"Inter", -apple-system, system-ui, sans-serif` | All interface text and body copy |
| Mono | `"JetBrains Mono", "Fira Code", monospace` | Code, complexity (`O(n log n)`), metrics, timestamps |

- **Eyebrow labels:** all-caps, `~11.5px`, letter-spacing `.12em`, weight 600, color `muted`/`faint`.
- **Serif accent phrase:** headlines may wrap a key phrase in `[brackets]` colored `green` (axi.md signature move).
- In-product fonts are **self-hosted** via `next/font` (offline + performance), not the Google Fonts CDN used in the mockup.

### Radius & elevation

- Radius: cards `10px`, popup/dashboard shell `14px`, buttons `9px`, pills `20px`.
- Elevation: shells use a single soft warm shadow, e.g. `0 18px 44px -20px rgba(40,34,28,.3)`; interior cards are flat (border only).

## Surfaces

- **Plugin popup (~360px):** paper shell, serif wordmark + green status dot, one "accepted submission" card (title, difficulty/pattern/language badges, runtime/memory metrics), a single primary **Pull & Send to GitHub** action, a compact recent-syncs list, and a footer linking to the dashboard/settings. Compact, single primary action, glanceable status.
- **Web dashboard:** serif wordmark + text nav (Overview / Problems / Revision / Insights) + avatar; a serif headline that states the day's story; a 4-up stats row (Solved / Streak / Patterns / Due today); a recent-submissions table (problem · difficulty · pattern · solved); and a right rail with the revision queue + an AI-insight card. GitHub sync status is **not** shown on the overview table - it belongs on the detailed problems grid.

## Implementation notes

- Encode the tokens above as CSS variables + the `tailwind.config` theme in the web app (Tailwind + shadcn/ui per `docs/TECH_STACK.md`).
- Reuse the same variables in the plugin popup so it stays a compact sibling.
- **Verify UI changes in a real browser** with `chrome-devtools-axi` (see CLAUDE.md), not just build/typecheck.
