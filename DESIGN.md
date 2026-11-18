---
name: Ian Menachery
description: An editor's contact sheet of checked claims, keepers circled and failures crossed out and left on the sheet.
colors:
  china-marker: "#f2c94c"
  grease: "#d42a20"
  grease-light: "#c8211a"
  edge-amber: "#d9a046"
  heat: "#b8241b"
  heat-light: "#e0645a"
  ground: "#161411"
  ground-2: "#201d19"
  ink: "#ece9e3"
  ink-2: "#aba59b"
  rule: "#38332c"
  hole: "#e9e6de"
  ground-light: "#f7f7f4"
  ground-2-light: "#ebeae5"
  ink-light: "#121110"
  ink-2-light: "#57534c"
  rule-light: "#d3d0c9"
  film: "#050404"
  on-film: "#ece9e3"
  window: "#e2e0da"
  window-ink: "#151413"
  window-ink-2: "#5d5953"
  fail-bg: "rgb(212 42 32 / 0.28)"
  warn-bg: "rgb(242 201 76 / 0.2)"
  ready-bg: "rgb(126 178 116 / 0.22)"
  fail-bg-light: "rgb(200 33 26 / 0.16)"
  warn-bg-light: "rgb(214 160 20 / 0.22)"
  ready-bg-light: "rgb(60 130 60 / 0.16)"
  cat-politics: "#3987e5"
  cat-sports: "#d95926"
  cat-geopolitics: "#199e70"
  cat-crypto: "#c98500"
  cat-entertainment: "#d55181"
  cat-other: "#9085e9"
  cat-politics-light: "#2a78d6"
  cat-sports-light: "#eb6834"
  cat-geopolitics-light: "#1baf7a"
  cat-crypto-light: "#eda100"
  cat-entertainment-light: "#e87ba4"
  cat-other-light: "#6250d6"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(3.4rem, 15.5vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2.125rem, 7vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline-chapter:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2rem, 6.4vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title-section:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  lede:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.25rem, 4.6vw, 1.625rem)"
    fontWeight: 400
    lineHeight: 1.38
  body:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  body-reading:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.65
  ui:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 72"
  edge-print:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "calc(1.3 * var(--u))"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 62"
  china-note:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "calc(2.3 * var(--u))"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
    fontVariation: "'wdth' 80"
rounded:
  hairline: "2px"
  code: "3px"
  window: "calc(0.5 * var(--u))"
  round: "50%"
spacing:
  film-unit: "6px"
  gutter: "16px"
  gutter-wide: "32px"
  section: "72px"
  page: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.ui}"
    rounded: "{rounded.hairline}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.china-marker}"
    textColor: "{colors.film}"
  button-quiet:
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.hairline}"
    padding: "0 20px"
    height: "46px"
  button-quiet-hover:
    backgroundColor: "{colors.ground-2}"
  input-field:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.hairline}"
    padding: "6px 8px"
    height: "36px"
  nav-link:
    textColor: "{colors.on-film}"
    typography: "{typography.label}"
    padding: "6px 0"
  rebate:
    backgroundColor: "{colors.film}"
    textColor: "{colors.on-film}"
  frame-window:
    backgroundColor: "{colors.window}"
    textColor: "{colors.window-ink}"
    rounded: "{rounded.window}"
    width: "calc(36 * var(--u))"
    height: "calc(24 * var(--u))"
  code-inline:
    backgroundColor: "{colors.ground-2}"
    rounded: "{rounded.code}"
    padding: "0.1em 0.35em"
---

# Design System: Ian Menachery

## Overview

**Creative North Star: "The Editor's Contact Sheet"**

The site is a sheet of film an editor has gone over with a grease pencil. Black 35 mm strips with sprocket holes, amber edge print and frame numbers, frames lit like a light table; keepers looped in red, the claims that didn't hold crossed out and left in place. Dark is the darkroom (warm black ground, the default); light is the print (white paper). The film itself is black in both, so switching theme changes the room, never the material.

Density is editorial. Big condensed Archivo headings, a serif reading column, ruled index rows, and very little chrome. Ornament comes only from the film's own furniture: sprocket rebates on the masthead, footer and case-study meta line, edge print, grease marks, yellow china-marker notes. Motion is one authored moment, the pinned strip advancing frame by frame with its marks drawing on, plus the "develop" wipe when the theme changes. Nothing else animates in.

Honesty is the visual idea. A crossed-out frame and a cross in a case study's margin are a finding, styled with the same care as a kept one.

**Key Characteristics:**
- Two themes, one film: black strips (#050404) never change; only ground, ink and marks' surroundings flip.
- Everything on the film is sized in film units (`--u`, one millimetre of 35 mm film).
- Grease red marks verdicts; china-marker yellow carries notes, focus, selection and the primary hover.
- Archivo for display, UI and condensed edge print; Source Serif 4 for reading.
- Flat, ruled, opaque. Depth comes from film on ground, not shadows.

## Colors

A warm neutral room around black film, with three marking colors taken from an editor's kit: amber edge print, red grease pencil, yellow china marker.

### Primary
- **China Marker Yellow** (`china-marker`): the editor's notes (KEEP, DIDN'T HOLD) rotated on the black rebate, text selection, the skip link, the primary button's hover fill, and focus and control accent in the dark theme. Same value in both themes, because it only ever sits on film or as a solid fill.

### Secondary
- **Grease Pencil Red** (`grease`, `grease-light` in the print): the loops and crosses on frames, the margin marks beside Results and What didn't work, and in light mode the link underline, focus ring and control accent. A stroke, never a fill or a text color.

### Tertiary
- **Edge-Print Amber** (`edge-amber`): edge print, frame numbers, the masthead name, link underlines on the rebate, and link underlines in the dark theme. It is the film's own manufacturer printing, so it lives on black.

### Neutral
- **Darkroom Black** (`ground`) / **Print White** (`ground-light`): the page ground in each theme.
- **Tray** (`ground-2` / `ground-2-light`): the one raised neutral: inputs, inline code, quiet-button hover, the heatmap's zero end.
- **Ink** (`ink` / `ink-light`) and **Pencil Grey** (`ink-2` / `ink-2-light`): text and secondary text (meta lines, table heads, list dashes). Pencil Grey measures 7.5:1 on the darkroom and 7.1:1 on the print.
- **Rule** (`rule` / `rule-light`): every 1px divider, input border and range track.
- **Film Black** (`film`) with **On-Film** text (`on-film`): strips, rebates, the 6x6 roll frame and the case-study meta line. Theme-invariant.
- **Sprocket** (`hole`): the punched holes; in the print they show the paper (#f7f7f4).
- **Light-Table Window** (`window`) with **Window Ink** (`window-ink`, `window-ink-2`): the lit frame and what is printed on it.

### Data and status
- **Status washes** (`fail-bg`, `warn-bg`, `ready-bg`, each with a `-light` value): translucent row and cell fills in the demos' tie-out tables. They tint a labelled cell; the label carries the meaning.
- **Heat** (`heat` / `heat-light`): the push/fold frequency heatmap, mixed in OKLab from Tray to Heat by frequency, with the value printed in each cell.
- **Category series** (`cat-*`, each with a `-light` value; `cat-all` uses Ink): fixed per category in the calibration explorer. Politics, sports and geopolitics, the first three slots, pass all-pairs CVD separation in both themes. On the darkroom every slot clears 4.6:1. On the print, sports (2.98:1), geopolitics (2.62:1), crypto (2.02:1) and entertainment (2.51:1) measure under 3:1 against the paper; they are relieved by visible legend labels and the Brier table, never by color alone.

### Named Rules
**The Same Film Rule.** Film, on-film text, the window, edge amber and china yellow are identical in both themes. A theme swaps the room, never the strip.

**The Grease Is A Verdict Rule.** Red grease marks one thing: a judgment on a claim (loop = held, cross = didn't hold), plus light-mode links and focus. It is never decoration, a fill, or body text.

## Typography

**Display Font:** Archivo, variable with the `wdth` axis (with Arial Narrow, Arial, sans-serif)
**Body Font:** Source Serif 4, variable with `opsz` and optical sizing on (with Georgia, Times New Roman, serif)
**Label/Mono Font:** Archivo condensed through `wdth` for labels and edge print; `ui-monospace, Cascadia Mono, Consolas` only for inline code

**Character:** A heavy, tight grotesque that condenses into film-stock lettering, set against a calm book serif. One family does headings, UI and the film's printing by moving along its width axis.

### Hierarchy
- **Display** (800, clamp(3.4rem, 15.5vw, 6rem), 0.9): the name on home only. Case-study h1 (clamp(2.5rem, 10vw, 4.75rem), 0.95) and demo h1 (clamp(2.375rem, 9vw, 4.25rem), 0.96) are the same voice a step down.
- **Headline** (800, clamp(2.125rem, 7vw, 3.75rem), 0.98, -0.035em): home section titles. Chapter headings beside the strip run a step smaller (clamp(2rem, 6.4vw, 3.25rem), 1).
- **Title** (700, 1.375rem, 1.15): index-row titles; CV terms at 1.125rem; case-study h2 at 1.625rem; demo h2 at 1.5rem.
- **Lede** (Serif 400, clamp(1.25rem, 4.6vw, 1.625rem), 1.38, max 30ch): the hero line and the first paragraph of a case study.
- **Body** (Serif 400, 1.0625rem, 1.6): default. Reading columns step up: chapters 1.125rem/1.62 at 66ch, case studies 1.125rem rising to 1.1875rem at 720px, 1.65, 68ch.
- **UI** (Archivo 500-700, 0.9375rem): buttons, links lists, captions, inputs, tables (tabular figures).
- **Label** (Archivo wdth 72, 600, 0.8125rem, 0.07em, uppercase): meta lines, table heads, fieldset legends, "Frame N".
- **Edge print** (Archivo wdth 62, 600, 1.3 film units, 0.12em, uppercase): only on film.
- **China note** (Archivo wdth 80, 800, 2.3 film units, uppercase, rotated -4deg): only on the strip's lower rebate.

### Named Rules
**The Width Axis Rule.** Condense Archivo through `wdth`, never a second family: 72 for labels, 70 in the masthead nav, 62 for edge print, 80 for china notes. Headings stay at full width.

**The Label Sits Below Rule.** A caps label sits beneath or inline with what it describes: the degree line under the name, the kind under an index title, "Frame N" ahead of its caption. It never sits above a heading.

## Layout

A single 1280px page column with 16px gutters, 32px from 720px. Home sections open with 72px of top padding; the footer sits 64px below the last section. From 900px the system uses 12-part grids: hero 7/5 (name and degree line span both), work index 4/6/2 (title, summary, links stacked), compact lab index 4/8, CV 4/5/3 on a shared baseline, about 5/7. Chapter text indents by 22% beside the pinned strip. Case studies read in a 68ch column, demos in 72ch.

Lists are ruled, not boxed: a 1px top rule, then 1px under every row (22px/24px row padding in the index, 16px in the CV).

The film has its own geometry in film units (`--u` 6px, growing as clamp(6px, 1.1svh, 9px) from 720px; `--mu` stays 6px for masthead and footer rebates). A strip is 35u tall with 5.5u sprocket bands; frame pitch is 38u; the window is 36x24u at 1u from the frame edge. Breakpoints are 720px (film unit, gutter, reading size), 900px (grids, chapter indent) and 1100px (margin marks hang left of case-study headings). At 375px nothing scrolls horizontally; tables scroll inside themselves.

## Elevation & Depth

Flat and opaque. Depth comes from black film laid on a warm ground and from the lit window inside each frame. Two objects cast a shadow because they are physical things lifted off the sheet.

### Shadow Vocabulary
- **Loupe** (`filter: drop-shadow(0 calc(1.2 * var(--u)) calc(1.4 * var(--u)) rgb(0 0 0 / 0.5))`): the WebGL lens resting on the strip.
- **Range thumb** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.4)`): the china or grease-colored slider knob in demos.

### Named Rules
**The Only Lifted Objects Rule.** Cards, text, buttons and sections never cast shadows. A shadow means a physical tool sitting on the sheet.

## Shapes

Nearly square. Buttons, inputs, fieldsets, the rebated meta line and the roll frame take a 2px corner; inline code and the headshot 3px; the light-table window 0.5 film units; the theme switch and range thumb are round. Borders are 1px rules, except buttons at 1.5px Ink. The recurring silhouettes come from the film: sprocket holes as a repeating SVG mask (a 1.98x2.6 rounded rect every 4.75 units), and hand-drawn grease strokes, Catmull-Rom loops that overshoot their start and two-stroke crosses, rendered as round-capped SVG paths seeded so server and client draw the same mark.

## Components

The shared furniture (tokens, masthead, footer, buttons, film strip, loupe, index lists, grease marks) belongs to the system. The Read block (case-study prose) and the Operate block (demo controls) are owned and extended separately and may move into their own stylesheets (`app/work/prose.css`, `app/lab/lab.css`); they build on these tokens and add no new colors or families.

### Buttons
- **Shape:** squared off (2px), 1.5px Ink border, 46px tall, 20px sides; demo buttons 40px tall, 16px sides.
- **Primary:** Ink fill with ground-colored text, Archivo 700 at 0.9375rem.
- **Hover / Focus:** primary swaps to solid China Marker Yellow with Film Black text; quiet fills with Tray. 120ms ease-out color change; nothing fades or moves. Focus is a 2px ring in the focus color (yellow dark, red light) at 3px offset.
- **Quiet:** transparent with the same border and Ink text.
- **Segmented (demos):** buttons butt together with a shared 1.5px border; the pressed one fills Ink.

### Inputs / Fields
- **Style:** Tray fill, 1px Rule border, 2px corner, 36px min height, Archivo with tabular figures. Fieldsets are 1px ruled boxes with a caps legend.
- **Hover / Focus:** border darkens to Pencil Grey; the global focus ring applies.
- **Controls:** radios, checkboxes and the range thumb take the control accent (`--ctl`: yellow dark, red light). Range track is a 4px Rule bar.
- **Disabled:** Rule border, Pencil Grey text, not-allowed cursor.

### Navigation
- **Masthead:** a film rebate across the top (sprocket band in `--mu`), name in Edge Amber at left, nav in condensed caps (wdth 70) on On-Film, theme switch at right. Links underline 2px on hover.
- **Footer:** the matching bottom rebate, links in Archivo at 0.02em, wrapping.
- **Theme switch:** a 36px round button, inline half-disc icon, hover to china yellow. Switching runs the "develop" wipe: the new theme's view rises out of the tray (clip-path from the bottom, 520ms, cubic-bezier(0.16, 1, 0.3, 1)); skipped under reduced motion.

### Links
Inherit text color with a 1.5px underline at 0.22em offset in the link color (amber dark, red light); hover thickens to 3px. Index titles carry no underline until hover.

### Film Strip (signature)
A pinned 12-frame strip of 35 mm film, advanced frame by frame by vertical scroll: each frame holds for 55% of its scroll share, then the strip moves on. Each frame has a lit window, a frame number and edge print in amber, a china-marker note on the lower rebate, and a grease mark that draws on via stroke-dashoffset as the frame passes the reading position (a cross's second stroke follows the first). A caption line below names the current frame. Under reduced motion the strip is a static, horizontally scrollable row with scroll snap, every mark drawn, no pin.

### Loupe (signature)
A WebGL lens with barrel magnification, slight chromatic split and a darkened wall, resting just right of the frame being read so it previews the next one. Draggable or moved with arrow keys. It mounts on the first scroll, touch, pointer or key, so it never competes with first paint.

### Margin Marks
In case studies, a grease loop beside "Results" and a cross beside "What didn't work" (and its variants), inline at small widths and hanging in the left margin from 1100px.

### Edge-Print Meta Line
A case study's links, stack and date line is set as a strip of film: Film Black with a top sprocket band, condensed caps, links in Edge Amber. Full-bleed on phones, 2px corners from 720px.

### Index Row
Ruled rows: title in Archivo 700, a caps kind label below it in Pencil Grey, a serif summary at 60ch, and a column of text links (Case study, Demo, Code, or a "Private repo" label).

## Do's and Don'ts

### Do:
- **Do** size anything on film in film units (`--u`, 6px rising to 9px) so holes, windows, edge print and notes keep their proportions.
- **Do** keep film Film Black in both themes and let only ground, ink and marks' surroundings change.
- **Do** mark claims with grease: a loop for held, a cross for didn't hold, and leave crossed frames on the sheet.
- **Do** separate list items with 1px horizontal rules and keep the work list an editorial index.
- **Do** label every chart series in text and back it with a table; color is never the only encoding.
- **Do** give every motion a reduced-motion state: static scrollable strip, all marks drawn, no pin, no view transition.
- **Do** build Read and Operate styles on these tokens, adding no new colors or font families.

### Don't:
- **Don't** put a caps label, badge or eyebrow above a heading.
- **Don't** use gradients, gradient text or glassmorphism; film, paper and the tray are flat and opaque.
- **Don't** add grain or noise to the film; edge print and grease carry its texture.
- **Don't** fade or slide sections in on scroll; the strip is the one authored motion.
- **Don't** box lists into cards or give them colored left borders.
- **Don't** let a button fade on hover; it swaps to a solid fill.
- **Don't** set headings or accent words in serif italic; headings are Archivo.
- **Don't** add an icon set; the theme switch's inline half-disc is the only icon.
- **Don't** cast shadows from anything but the loupe and the range thumb.
