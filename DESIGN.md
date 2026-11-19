---
name: Ian Menachery
description: Minimal black and white with a soft cobalt accent, one centred column of what Ian has done.
colors:
  ground: "#0b0b0b"
  ground-2: "#161616"
  ink: "#ededeb"
  ink-2: "#9d9d99"
  rule: "#232323"
  accent: "#a3b3e6"
  on-accent: "#0b1030"
  accent-text: "#aebce9"
  link-line: "#6b6b68"
  link-hover: "#8a9bd3"
  focus: "#a3b3e6"
  ctl: "#a3b3e6"
  heat: "#4a5fb0"
  ground-light: "#ffffff"
  ground-2-light: "#f3f3f1"
  ink-light: "#141414"
  ink-2-light: "#5e5e5a"
  rule-light: "#e7e7e4"
  accent-light: "#3f58b8"
  on-accent-light: "#ffffff"
  accent-text-light: "#3f58b8"
  link-line-light: "#a3a39f"
  link-hover-light: "#3f58b8"
  focus-light: "#3f58b8"
  ctl-light: "#3f58b8"
  heat-light: "#4a62bd"
  fail-bg: "rgb(212 42 32 / 0.28)"
  warn-bg: "rgb(242 201 76 / 0.2)"
  ready-bg: "rgb(126 178 116 / 0.22)"
  fail-bg-light: "rgb(200 33 26 / 0.16)"
  warn-bg-light: "rgb(214 160 20 / 0.22)"
  ready-bg-light: "rgb(60 130 60 / 0.16)"
  cat-all: "#ededeb"
  cat-politics: "#3987e5"
  cat-sports: "#d95926"
  cat-geopolitics: "#199e70"
  cat-crypto: "#c98500"
  cat-entertainment: "#d55181"
  cat-other: "#9085e9"
  cat-all-light: "#141414"
  cat-politics-light: "#2a78d6"
  cat-sports-light: "#eb6834"
  cat-geopolitics-light: "#1baf7a"
  cat-crypto-light: "#eda100"
  cat-entertainment-light: "#e87ba4"
  cat-other-light: "#6250d6"
typography:
  display:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 9vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 7vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title-item:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "1.03125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.005em"
  name-mark:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.96875rem"
    fontWeight: 650
    lineHeight: 1
  meta:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.96875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.90625rem"
    fontWeight: 600
    lineHeight: 1.3
  ui:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.90625rem"
    fontWeight: 500
    lineHeight: 1.4
  button:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "0.90625rem"
    fontWeight: 600
    lineHeight: 1
  data-cell:
    fontFamily: "Archivo, Arial Narrow, Arial, sans-serif"
    fontSize: "clamp(0.5rem, 2.3vw, 0.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum"
    fontVariation: "'wdth' 75"
  lede:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "clamp(1.1875rem, 4vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.5
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
rounded:
  hairline: "2px"
  code: "4px"
  control: "6px"
  photo: "8px"
  round: "50%"
spacing:
  gutter: "20px"
  gutter-wide: "40px"
  column: "760px"
  reading: "68ch"
  operate: "68ch"
  row: "12px"
  section: "28px"
  footer: "72px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  button-quiet:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-quiet-hover:
    backgroundColor: "{colors.ground-2}"
  input-field:
    backgroundColor: "{colors.ground-2}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.control}"
    padding: "6px 8px"
    height: "36px"
  nav-link:
    textColor: "{colors.ink-2}"
    typography: "{typography.ui}"
    padding: "4px 0"
  nav-link-hover:
    textColor: "{colors.ink}"
  list-title:
    textColor: "{colors.ink}"
    typography: "{typography.title-item}"
  list-title-hover:
    textColor: "{colors.accent-text}"
  segment-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
  ev-cell:
    textColor: "{colors.ink}"
    typography: "{typography.data-cell}"
  ev-cell-cold:
    textColor: "{colors.ink-2}"
  theme-toggle:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.round}"
    size: "32px"
  code-inline:
    backgroundColor: "{colors.ground-2}"
    rounded: "{rounded.code}"
    padding: "0.1em 0.35em"
---

# Design System: Ian Menachery

## Overview

**Creative North Star: "The Plain Record"**

Minimal black and white with a soft cobalt accent. Dark is the default and light is a real theme with its own values, not an inversion. Archivo carries names, headings and UI; Source Serif 4 carries reading. The page is one centred column, stacked in order: the name, a degree line, a roles line, Resume and Contact, then short Experience and Projects lists. Home leads with what Ian has done and keeps prose to a sentence where a sentence will do.

Density is quiet. Ruled lists, small grey section titles, generous space around the name, and almost no chrome. The cobalt is rare on purpose: it appears on hover, focus, selection, the primary button's hover fill, and the push/fold heat. Everything else is ink on ground.

Motion is a handful of small, specific moments. A one-time intro entrance on the first visit to home, in which the name only moves and never starts invisible, so it paints at once and LCP is not delayed. A project title that morphs into its case-study heading through React's `<ViewTransition>` (name `project-<slug>`, `share="morph"`). Hover details: the arrow nudges and the underline draws across. The theme switch wipes the new theme up from the bottom, scoped to `[data-theming]` so navigation keeps its own transition. And a live push/fold EV grid on home. All of it is off under `prefers-reduced-motion`.

**Key Characteristics:**
- Black, white and one soft cobalt; dark by default, with a real light theme.
- Archivo for names, headings and UI; Source Serif 4 for reading.
- One centred 760px column with ruled lists and no cards.
- Flat and opaque: no shadows anywhere.
- Small, authored motion, every piece of it off under reduced motion.

## Colors

Near-black and near-white neutrals with one desaturated cobalt that is lighter and softer in the dark theme and deeper in the light one.

### Primary
- **Soft Cobalt** (`accent`, #a3b3e6 dark, #3f58b8 light): text selection, the skip link, the primary button's hover fill, the focus ring (`focus`) and form-control accent (`ctl`), which take the same value. Text on it uses **Cobalt Ink** (`on-accent`, #0b1030 dark, #ffffff light), 9.0:1 dark and 6.4:1 light.
- **Cobalt Text** (`accent-text`, #aebce9 dark, #3f58b8 light): list titles and their arrows on hover. 10.5:1 on the dark ground and 6.4:1 on the light.
- **Cobalt Underline** (`link-hover`, #8a9bd3 dark, #3f58b8 light): the underline colour a link takes on hover, and the line that draws under UI links.

### Neutral
- **Off-Black** (`ground`, #0b0b0b) and **Paper White** (`ground-light`, #ffffff): the page ground.
- **Raised Grey** (`ground-2`, #161616 / #f3f3f1): the one raised neutral. Inputs, inline code, blockquotes in demos, the quiet button's hover, and the cool end of the heat mix.
- **Bone** (`ink`, #ededeb) and **Near-Black** (`ink-light`, #141414): text, the primary button fill, pressed segments. 16.8:1 dark and 18.4:1 light.
- **Graphite** (`ink-2`, #9d9d99 / #5e5e5a): secondary text. Section titles, degree and roles lines, dates, list descriptions, nav and footer links at rest, table heads. 7.2:1 dark and 6.5:1 light.
- **Hairline** (`rule`, #232323 / #e7e7e4): every 1px divider, button and input border, fieldset, and range track.
- **Underline Grey** (`link-line`, #6b6b68 / #a3a39f): the resting underline under body links.

### Data and status
- **Heat** (`heat`, #4a5fb0 dark, #4a62bd light): the push/fold grid's shading, mixed in sRGB from Raised Grey toward Heat. A hand that beats folding starts at 20% and rises with its EV gain, capped at 80% heat, so ink on the hottest cell stays AA: 6.5:1 dark and 4.8:1 light.
- **Status washes** (`fail-bg`, `warn-bg`, `ready-bg`, each with a `-light` value): translucent fills on table rows, cells and verdict lines in the demos. The text label always carries the meaning.
- **Category series** (`cat-*`, each with a `-light` value; `cat-all` matches Ink): fixed per category in the calibration explorer, with every series named in a text legend.

### Named Rules
**The One Blue Rule.** Cobalt is the only hue outside the demos' data and status colours. It marks interaction (hover, focus, selection, pressed fill) and the EV heat, never decoration or a heading.

**The Real Light Theme Rule.** Each theme sets its own values for every token. Light is tuned for white paper (a deeper cobalt, a darker Graphite), never computed by inverting dark.

## Typography

**Display Font:** Archivo, variable with the `wdth` axis (with Arial Narrow, Arial, sans-serif)
**Body Font:** Source Serif 4, variable with `opsz` and optical sizing on (with Georgia, Times New Roman, serif)
**Label/Mono Font:** `ui-monospace, Cascadia Mono, Consolas, monospace`, for inline code only

**Character:** A firm, tightly tracked grotesque for names and controls beside a calm book serif for anything meant to be read through.

### Hierarchy
- **Display** (700, clamp(2.5rem, 9vw, 3.5rem), 1, -0.035em): the name on home only.
- **Headline** (700, clamp(2.25rem, 7vw, 3.25rem), 1, -0.035em): page titles, case-study h1 and demo h1.
- **Title** (650, 1.375rem, 1.2, -0.01em): h2 in case studies and demos; demo h3 runs 650 at 1.125rem.
- **Title Item** (600, 1.03125rem, 1.35): list titles in Experience, Projects and Lab. The role after an employer drops to 400 in Graphite.
- **Meta** (Archivo 500, 0.96875rem, 1.5): the degree and roles lines under the name.
- **Label** (Archivo 600, 0.90625rem, 1.3, Graphite): section titles (Experience, Projects, Lab, About, Contact), sentence case.
- **UI** (Archivo 500, 0.90625rem, 1.4): nav, footer, EV controls; buttons run 600 at line-height 1; dates and side links 500 at 0.875rem with tabular figures.
- **Data Cell** (Archivo 600, clamp(0.5rem, 2.3vw, 0.75rem), `wdth` 75, tabular figures): hand names and EVs in the push/fold grid, the one place Archivo condenses.
- **Lede** (Serif 400, clamp(1.1875rem, 4vw, 1.3125rem), 1.5): the paragraph right after a case-study h1.
- **Body** (Serif 400, 1.0625rem, 1.6): default; list descriptions and section notes at 1rem.
- **Body Reading** (Serif 400, 1.125rem rising to 1.1875rem at 720px, 1.65, 68ch): case-study prose.

### Named Rules
**The Two Families Rule.** Archivo for names, headings and UI; Source Serif 4 for reading. No third family beyond monospace for code, and headings are never serif.

**The Quiet Section Title Rule.** Section titles are small Graphite Archivo in sentence case. The list under them carries the weight; titles never shout or sit in caps.

## Layout

One centred column: 760px of content inside a 20px gutter, 40px from 720px. Every page shares it, so the masthead, home, the indexes, case studies and demos all start on the same left edge. The reading measure is capped on the text instead: case-study blocks at 68ch, demo paragraphs at 68ch, while tables and the EV grid may use the full column. Home stacks the intro (48px top, 96px from 720px), then sections with 28px top padding, each a small title over a ruled list. On the work and lab pages the footer sits 72px below the content under a 1px rule that spans the column; home has no footer because it ends with its own Contact section.

Lists are ruled rows, not boxes: a two-column grid (title left, date or links right) with 12px row padding and a 1px rule between rows, none above the first. A description spans both columns under the title at 62ch. Below 560px the side column drops under the title and left-aligns, and the EV grid shows one decimal instead of two. Below 440px the nav keeps one line by hiding Contact, which stays reachable from home's button and the footer. The EV grid is 13 square cells across with 1px gaps, 19rem to 40rem wide, and scrolls inside itself if it must. At 375px nothing scrolls the page horizontally; tables scroll inside themselves.

## Elevation & Depth

Flat and opaque. There are no shadows anywhere in the system. Depth comes only from Raised Grey against the ground (inputs, code, blockquotes, heat cells) and from 1px Hairline rules. The masthead holds still during navigation by keeping its own view-transition name; it is not lifted or blurred.

### Named Rules
**The No Shadow Rule.** Nothing casts a shadow: not buttons, lists, the headshot, the range thumb or the grid. A surface that needs separation gets Raised Grey or a Hairline.

## Shapes

Gently rounded and consistent. Buttons, inputs, selects, fieldsets, segmented controls and demo blockquotes take 6px; the headshot 8px; inline code and trace rows 4px; the focus ring and range track 2px; the theme switch and range thumb are round. Every border is a 1px Hairline. Segmented controls butt together with shared borders, rounding only their outer corners. The EV grid's cells are square with no radius. The theme switch's icon is an inline half-filled disc; the only other drawn marks are the list arrow (a 12px SVG) and the demo disclosure caret, two 1.5px borders rotated.

## Components

The shared furniture (tokens, masthead, footer, buttons, lists, EV grid, view transitions, reduced motion) lives in `app/globals.css`. Case-study (Read) styles live in `app/work/prose.css` and demo (Operate) styles in `app/lab/lab.css`; both build on these tokens and add no colours or families.

### Buttons
Rounded rectangles (6px), 40px tall with 16px sides, Archivo 600 at 0.90625rem, a 1px Hairline border. The primary fills with Ink and sets ground-coloured text; on hover it swaps to a solid Soft Cobalt fill with Cobalt Ink text. The quiet button is transparent with Ink text and fills with Raised Grey on hover. Changes run 120ms ease-out and are colour swaps to a solid fill, never fades or movement. Focus is a 2px ring in the focus colour at 3px offset. Demo buttons match at 40px with 16px sides, fill Raised Grey and darken their border to Graphite on hover, and show Graphite text with a not-allowed cursor when disabled.

### Inputs / Fields
Raised Grey fill, 1px Hairline border, 6px corners, 36px minimum height, Archivo at 0.9375rem with tabular figures. The border darkens to Graphite on hover and the global focus ring applies. Radios and checkboxes take the control accent. In demos and on the EV grid's stack slider the range input is redrawn: a 4px Hairline track and a round thumb in the control accent with a ground-coloured ring. Fieldsets are 6px Hairline boxes with a Graphite Archivo legend.

### Navigation
The masthead shares the column: the name in Archivo 650 at the left, then Work, Lab, Resume and Contact in Graphite Archivo 500 and the theme switch at the right. UI links carry no underline at rest; on hover a 1px Cobalt Underline draws across from the left (220ms) and the text brightens to Ink. The footer, on work and lab pages only, repeats the pattern under a Hairline: email, LinkedIn, GitHub, Resume (PDF). On phones (440px and below) the masthead drops Contact to keep one line; home's Contact button and the footer still reach it. The `theme-color` meta follows the theme (#0b0b0b dark, #ffffff light) so a phone's browser bar matches the ground. The theme switch is a 32px round button with a 20px half-disc icon; it runs the wipe described below, and skips it under reduced motion.

### Links
Body links inherit the text colour with a 1px underline in Underline Grey at 0.22em offset, turning Cobalt Underline on hover over 120ms.

### Lists
Ruled rows: an Archivo 600 title, a right-aligned date or a set of side links (Demo, Code, or a "Private repo" note) in Graphite with tabular figures, and a Graphite serif description below. A linked title turns Cobalt Text on hover and its trailing arrow, a 12px inline SVG stroked in currentColor (`components/arrow.tsx`), nudges 4px right and turns cobalt (160ms). A project title is wrapped in a `<ViewTransition>` named `project-<slug>` with `share="morph"`, and its case study's h1 carries the same name, so opening a project morphs the title into the heading over 360ms. The title inside is one inline-block box so the morph moves a single shape.

### Push/Fold EV Grid (signature)
A live 13 by 13 grid of starting hands on home and in the push/fold demo, showing EV only: each cell prints the hand and its all-in EV in big blinds. Values are lookups from showdown's export, loaded when the figure nears the viewport, with no solving in JavaScript. A stack slider (1 to 20 bb) and a two-part segmented control (Small blind jams, Big blind calls) sit above it; in the push/fold demo a second one (No ante, 10% ante) follows them. Hands that beat folding shade toward Heat by their EV gain, from 20% up to the 80% cap; the rest print in Graphite on the ground. The selected cell takes a 2px Ink outline; arrow keys move through the grid with a single tab stop, and a live line below states the selected hand's EV against folding in words. Cell colour changes run 180ms.

### Intro and Theme Wipe
The first visit to home plays the intro once per session: the name rises 0.35em without fading, and the degree line, roles line and actions rise 0.6em and fade in, staggered 70ms, all over 560ms on cubic-bezier(0.16, 1, 0.3, 1). The theme switch lets the new theme rise from the bottom over 520ms on the same curve, clipped from below, only while `[data-theming]` is set.

## Do's and Don'ts

### Do:
- **Do** keep cobalt for interaction and heat: hover, focus, selection, the primary hover fill, and the EV grid.
- **Do** set both themes' value for any new token; the light theme is tuned, not inverted.
- **Do** separate list items with 1px Hairline rules and keep lists in the one centred column.
- **Do** keep text on any heat or status fill at WCAG AA, as the 80% heat cap does for the EV grid.
- **Do** give every motion a reduced-motion state; the global rule turns transitions, animations and view transitions off.
- **Do** keep the name visible from the first frame; an entrance may move it but never start it at zero opacity.
- **Do** name every chart series and status in text; colour is never the only encoding.
- **Do** build Read and Operate styles on these tokens in their own stylesheets, adding no colours or families.

### Don't:
- **Don't** use gradients, gradient text, glassmorphism or grain.
- **Don't** cast shadows from anything.
- **Don't** fade or slide sections in on scroll; the intro plays once, on home, and nothing else enters.
- **Don't** box lists into cards or give them coloured left borders.
- **Don't** let a button fade on hover; it swaps to a solid fill.
- **Don't** set headings or accent words in serif italic.
- **Don't** put a badge or caps eyebrow above a heading.
- **Don't** add an icon set; the theme switch's half-disc is the one drawn icon.
