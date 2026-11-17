# site

Ian Menachery's portfolio: Next.js 16 (App Router), TypeScript, Tailwind 4, MDX. Deployed on
Vercel from `main`.

```bash
npm run dev     # local server
npm run build   # production build
npm test        # demo math checked against the Python originals
```

- `app/work/<slug>/page.mdx`: case studies. `app/lab/<demo>/`: client-side demos.
- `lib/`: ported demo math. `data/` exports come from each project's own Python.
- `scripts/resume_web_copy.py`: rebuilds `public/ian-menachery-resume.pdf` (phone removed) from
  the current resume.
- `docs/story.md`: the approved story and sitemap.

Styling is a placeholder until the visual design pass.
