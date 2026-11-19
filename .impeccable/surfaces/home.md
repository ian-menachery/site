# Surface brief: home (`app/page.tsx`)

Mode: Read, quickly. Related: `app/work/*` (Read), `app/lab/*` (Operate).

Confirmed by Ian, 2026-11-18, after a style ranking and three rounds of samples. This replaces the
"contact sheet" brief: the film theme, the pinned strip and the WebGL loupe are retired, and so is the
"I make data and AI dependable" hero line.

## What Ian picked and why

- Minimal black and white with a soft cobalt accent, dark by default with a real light theme. He ranked
  Brittany Chiang's and Brian Lovin's sites highest ("high quality all around", "highest quality for
  how simple it is"). He marked down sites that were "too simple" or "too boring", and ones that were
  "over the top". Round 1 was "a little extra"; the accents in round 2 were "a little too intense".
- Stacked layout over a Brittany-style split.
- No intro sentence: hero lines read as AI and over the top. He is "a college student who has done
  some internships" with "no large claims", so home lists what he has done.
- Kept motion: a one-time intro entrance, a project title morphing into its case-study heading, hover
  details, the theme-switch wipe, and a live push/fold grid that shows EV only ("how often" was nearly
  always 100%).

## Direction contract

OWN-WORLD: Off-black ground (#0b0b0b) in the default dark theme, white paper (#ffffff) in the light one,
near-white and near-black ink, a soft cobalt (#a3b3e6 dark, #3f58b8 light) used only for hover, focus,
selection and the push/fold heat. Archivo for names, headings and UI; Source Serif 4 for reading.

STORY: none on home. A visitor sees who Ian is, the roles he wants, and what he has done, then opens
a case study, a demo or the resume. The depth lives in the case studies.

THESIS: A quiet, well-made index of what Ian has done: his name, his degree, the roles he wants, then
his experience and projects, each one line deep. The case studies and demos carry the depth.

FIRST VIEWPORT: Masthead (name, Work, Lab, Resume, Contact, theme toggle). Name, then "Data Science +
Economics, Northeastern University, December 2026", the roles line ("Open to full-time 2027 roles in AI
solutions, consulting, analytics and data science."), and Resume + Contact. The top of Experience shows
below on desktop.

FORM: One centred column (760 px plus gutters). Sections are small grey headings over ruled lists:
Experience (org, role, dates, one line), Projects (title linking to the case study, Demo and Code
links, kind), Lab (the EV grid, then the demo list), About (headshot, one sentence), Contact.

DON'T: no tagline or claims in the hero, no story chapters on home, no film or grease ornament, no
pinned or horizontally scrolled sections, no sections fading in on scroll, no cursor effects.

seed: none (roll skipped). The direction came from Ian's ranking of 20 reference sites and three
sample rounds (private Artifact `claude.ai/code/artifact/8cf6237b-82ef-44d8-9d07-9f6b2d3c2a70`).
