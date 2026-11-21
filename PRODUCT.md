# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Confirmed by Ian, 2026-11-17, in this order of reach:

- **Recruiters on a phone.** They arrive from his resume, LinkedIn or an application, often on mobile, with a minute or two. They need the pitch, the roles he fits and the proof in the first screen.
- **Hiring managers and interviewers.** They go deeper before or after an interview: read a case study, try a demo, check the method and the honest failures.
- **Technical peers from GitHub.** They come from his profile or a repo and care about the code, the tests and how each demo matches its Python original.

The roles in play are full-time 2027 positions: AI solutions, implementation consulting, solutions analyst, tech consulting, data and business analytics, and data science.

## Product Purpose

Ian Menachery's portfolio (Data Science + Economics, Northeastern, graduating December 2026). It shows what he has done (internships at EY and Sun Life, and checked personal projects) so a visitor can open the proof in one click.

A visit succeeds when the visitor does any of these:
- opens a case study or a demo;
- downloads the resume;
- reaches out by email or LinkedIn;
- leaves remembering one specific thing (for example, "the one who reports his FAILs") rather than a generic portfolio.

## Positioning

"Check the work." Every project states a falsifiable question and bars set before the code, and reports results honestly, failures included: PMRA found no edge after costs, showdown kept a failed exploit gate, redline publishes a failed pre-registered event. The demos run on each project's own exported data, and 226 tests check the TypeScript against the Python originals. A generic portfolio can't truthfully copy the negative results or the verified demos.

## Operating Context

- Visitors reach the site from the resume PDF, LinkedIn's Website field, the GitHub profile README and job applications.
- It is hosted free on a `*.vercel.app` address and deploys on every push to `main`.
- Approved story and sitemap: `docs/story.md`. The home page runs: name, degree line, roles line, Resume + Contact; then Experience, Projects, Lab (with a live push/fold EV grid), About, Contact.

## Capabilities and Constraints

- Next.js 16 App Router, TypeScript, Tailwind 4, MDX, Cache Components on.
- Pages: home, a work index plus 7 case studies (`app/work/*/page.mdx`), and a lab index plus 5 client-side demos (`app/lab/*`).
- No backend and no API keys. Demo data is exported once from each source repo (`scripts/export_*.py`) and checked by tests in `lib/*.test.ts`.
- **Content rules:**
  - real numbers only;
  - never claim client-facing work at EY;
  - Orbit Break, Job Watch/Jobfill, bellwether, rentroll and dealflow stay off the site (the last two were removed 2026-11-20: private repos, no proof to open);
  - the redline DCF shows only ULTA and VRTX, as ranges, with no buy/sell framing;
  - the push/fold demo is lookups over showdown's export, never a JavaScript port, and never called "GTO".
- **Never publish:** personal documents (IDs, offer letters, transcripts, tax files), job-search data, third-party property data, `.env` files, or the phone number (the resume copy in `public/` has it removed).
- **Binding on every page** (confirmed 2026-11-17):
  - a reduced-motion fallback for all motion, scroll storytelling and WebGL;
  - a real light theme as well as the dark default;
  - WCAG AA contrast and keyboard-operable demos;
  - Lighthouse 90 or better for performance and accessibility on the deployed URL;
  - fast on a mid-range phone: 3D/WebGL loads after the content and never blocks reading;
  - works at 375 px with no horizontal page scroll.

## Brand Commitments

- **Name:** Ian Menachery. **Contact:** ianmenachery@gmail.com, linkedin.com/in/ianmenachery, github.com/ian-menachery.
- **Voice:** plain, specific, first person and takeaway-first. Every number is sourced and failures are stated. Case-study prose goes through Humanizer: no em dashes, no bold labels, no staged closers.
- **Feel Ian chose (binding; recorded, not expanded):** minimal and quiet; black and white with one soft cobalt accent; high quality for how simple it is. Home lists what he has done, with no tagline or claims. (2026-11-18; replaces "clean editorial, playful and interactive, dark and cinematic".)
- **UI experiments he asked for:** live project demos, one live figure on home (the push/fold EV grid), and small motion: a one-time intro entrance, project titles morphing into case-study headings, hover details. No WebGL or scroll storytelling (dropped 2026-11-18).
- **Don't-list** (Ian's, from `~/projects/ideas/lists/skills-to-try.md`): purple-to-blue gradients, gradient headline text, emojis in headings, Inter everywhere, colored left-border cards, glassmorphism, low-contrast dark mode, three icon boxes in a row, a badge above the headline, Lucide icons everywhere, untouched shadcn components, sections fading in on scroll, cursor spotlight effects, buttons that fade on hover, inconsistent spacing, em dashes everywhere, generic buzzword copy, serif italic accent words, the Space Grotesk + Instrument Serif pairing, grain texture.

## Evidence on Hand

- Case studies: `app/work/{showdown,redline,pmra,calibration,burnout}/page.mdx`.
- Demos: `app/lab/{push-fold,calibration,dcf}`, with their data in `data/`.
- Headshot: `public/headshot.jpg` (800×800, from the December 2025 studio shoot `_SID0566`).
- Resume: `public/ian-menachery-resume.pdf`.
- PMRA's own project site: https://ian-menachery.github.io/prediction-market-research-assistant/
- Two projects are in progress in their own sessions and will add a case study and demo each: Cutover (a migration tie-out kit) and a dependable helpdesk agent with an eval harness.
- **There are no testimonials, client logos, press or employer endorsements. Never fabricate them.**

## Product Principles

1. Show the work: every claim on the site leads to a case study, a demo or a repo.
2. Honest results over impressive ones: failures stay visible, and the design treats them as a feature.
3. The hurried visitor gets the point in the first screen, and the deep reader gets the method one click down.
4. The demos are real: each project's own data, tested against its Python.
5. Business-readable first, technical depth on request, to fit consulting and analytics roles as well as data science.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor; `prefers-reduced-motion` honoured everywhere; every demo operable by keyboard with real text labels (no colour-only encoding in the heatmap or charts).
