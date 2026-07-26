# ShekseCodeSync — Design Direction

> Status: direction set; full UI to be finalized in a lavish design session before any UI build (issue #14).

## Process (do this before building UI)

Both surfaces - the **browser plugin popup** and the **web dashboard** - get their look-and-feel finalized in a **lavish** design session first, signed off by the user, then recorded here and in `docs/DECISIONS.md`. Don't build dashboard/plugin UI ad-hoc; mock it in lavish first.

## Aesthetic direction

Take cues from **https://axi.md/** - inspired-by, not a copy. What we like there:

- **Typography-forward, clean, minimal.** The **font is the standout** - identify the actual typeface used on axi.md (inspect via `chrome-devtools-axi` or WebFetch) and adopt a matching/comparable font as the product's display face.
- Generous whitespace, restrained palette, content-first layout.

When the design session runs: capture axi.md's real font stack + palette, propose a ShekseCodeSync take (not a clone), and lock the tokens (font families, colors, spacing scale) here.

## Implementation notes

- Web dashboard uses Tailwind + shadcn/ui (per `docs/TECH_STACK.md`); encode the locked design tokens in `tailwind.config` + CSS variables.
- The plugin popup should feel like a compact sibling of the dashboard (same font/palette).
- **Verify UI changes in a real browser** with `chrome-devtools-axi` (see CLAUDE.md), not just build/typecheck.
