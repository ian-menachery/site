# Using Impeccable on this site

Impeccable (pbakaus/impeccable, pinned skill-v4.9.1) is installed for this repo only, chosen 2026-11-17 because it is the one design skill that pushes toward WebGL, motion and scroll storytelling instead of away from them. Call it as `/impeccable:impeccable <command> <target>`, or describe the design change and it usually picks itself.

## Which command for which task

| Task on this site | Command | Cost |
|---|---|---|
| Set up once, before the first design pass | `init` (writes PRODUCT.md) | small |
| Plan a page or section before coding it | `shape <page>` | medium |
| Build a new page or a new world/look | ordinary request ("build the work index page") | heavy: 25-40k tokens |
| Hero or section feels safe or generic | `bolder <target>` | 5-10k |
| WebGL, shaders, scroll-driven scenes, cinematic transitions | `overdrive <target>` | 5-10k |
| Motion and scroll reveals | `animate <target>` | 5-10k |
| Playful touches, personality | `delight <target>` | 5-10k |
| Type hierarchy, fonts | `typeset <target>` | 5-10k |
| Unusual layouts, spacing, rhythm | `layout <target>` | 5-10k |
| Too busy after an overdrive pass | `quieter <target>` or `distill <target>` | 5-10k |
| Design review of a page | `critique <target>` | ~12k |
| Accessibility, performance, responsive check | `audit <target>`, then `adapt` / `optimize` | 5-10k |
| Last pass before deploying | `polish <target>` | 5-10k |

Narrow targets ("the project grid", "the hero") cost far less than whole pages. Case-study prose goes through Humanizer (`/humanizer:humanizer`), not Impeccable's `clarify`.

## Guardrails (in `.claude/settings.local.json`)

- `disableAllHooks: true`: the engine runs only when a command calls it, never on session start or after each edit.
- `DO_NOT_TRACK=1` turns telemetry off; `IMPECCABLE_LIVE_COPY_AGENT=chat` keeps live mode inside the chat instead of launching a bypass-permissions agent.
- Don't run `impeccable login`, `/impeccable hooks on`, or `npx impeccable ...`.
- The first command downloads its engine binary to `%USERPROFILE%\.impeccable\bin\`. If Windows Defender flags it, uninstall: `claude plugin uninstall impeccable@impeccable --scope local`.
- `.gitignore` ignores `.impeccable/*` except `surfaces/` (surface briefs) and `design.json` (the DESIGN.md token sidecar), which are committed; `.claude/settings.local.json` stays ignored.

## In this environment (2026-11-18)

- The launcher (`scripts/impeccable`) is absent from the plugin cache and the engine binary is not run, so `concept-seed` and the detector never run. Read the references directly; record a skipped roll in the surface brief as `seed: none (roll skipped)` with the reason.
- The shipped subagents `impeccable:impeccable-finish-reviewer` and `impeccable:impeccable-documenter` work in sessions started after the plugin install; use them for the finish review and DESIGN.md.
- The visual system is in `DESIGN.md`; the home page's brief is `.impeccable/surfaces/home.md`.
