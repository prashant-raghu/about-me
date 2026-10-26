# AGENTS.md

Conventions for AI coding agents working in **about-me**. This file is the
canonical entry point under the [AGENTS.md](https://agents.md) standard, and it
is the first thing a Fredrin Worker reads.

## Project

Prashant Raghu's About Me page: one static page built only from his resume.
Light and dark, fast on a phone, no tracking. Prashant hosts it on Vercel from
https://github.com/prashant-raghu/about-me, and Vercel builds every push to
`main`. The Fredrin project itself runs in local git mode: never push.

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript strict,
Tailwind CSS 4, npm, Node 22.18 or newer.

| Path | What |
| --- | --- |
| `src/content/profile.ts` | every visible string on the page |
| `src/app/page.tsx` | the page (server component) |
| `src/app/layout.tsx` | metadata and the inline theme script |
| `src/app/icon.svg`, `src/app/opengraph-image.tsx` | the favicon and the 1200×630 share image |
| `src/app/robots.ts`, `src/app/sitemap.ts` | `robots.txt` and `sitemap.xml` |
| `src/lib/site-url.ts` | the absolute site URL behind `metadataBase`, robots and the sitemap |
| `src/app/globals.css` | palettes, fonts, the `mono` utility, the phone breakpoint |
| `src/components/theme-toggle.tsx` | the theme toggle, the only client component |
| `scripts/check-copy.mjs` | copy guard: no hyphens or dashes |
| `.claude/skills/verify-app/` | launch, drive and verify the app end to end |

## Commands

```bash
npm ci                                  # install from the lockfile
npm run dev                             # http://localhost:3000
npm run build                           # runs check:copy first; every route must show as ○ (Static)
npm start                               # serve the build
npm run lint
npm run check:copy                      # fails on a hyphen or dash in profile.ts copy
npx tsc --noEmit                        # after a build or dev run
bash .claude/skills/verify-app/run.sh   # build, serve, drive, screenshot, clean up
```

Every "verify it works" step goes through the `verify-app` skill.

CI: `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, `npx next typegen && npx tsc --noEmit` (typegen because a fresh checkout has no `.next/types`), `npm run check:copy` and `npm run build`, in that order, on every pull request and every push to `main`.

## Conventions

- **No hyphens or dashes in visible copy.** Not `-`, `–` or `—`. Write "long
  running", "production grade", "tool calling"; year ranges as "2023 to 2026"
  and "2026 to now". A middle dot "·" is fine, and so are hyphens inside URLs.
  `check:copy` enforces this for `profile.ts` and fails the build, so keep
  every visible string in `profile.ts`.
- **Facts come from the resume only.** Do not invent, embellish or reword.
- **No tracking.** No analytics, third party scripts, cookies or external font
  requests. The page requests its own origin only. Fonts are the system stack
  (`ui-sans-serif`, `ui-monospace`); do not add `next/font/google`.
- **Static only.** `/` and the metadata routes (`/icon.svg`,
  `/opengraph-image`, `/robots.txt`, `/sitemap.xml`) must prerender at build
  time: no `cookies()`, `headers()` or `searchParams`, no server actions, API
  routes, database or custom server. Keep the default Next.js build output
  for Vercel.
- **Site URL.** `NEXT_PUBLIC_SITE_URL` (see `.env.example`) is the base for
  the canonical link, `og:image`, robots and the sitemap. Unset,
  `src/lib/site-url.ts` falls back to Vercel's `VERCEL_PROJECT_PRODUCTION_URL`,
  then `http://localhost:3000`; only the origin is kept. It is read at build
  time. On Vercel preview builds Next points `og:image` and `twitter:image` at
  the preview deployment instead, by design.
- **One client component.** `src/components/theme-toggle.tsx` is the only
  `"use client"` file; `grep -rl '"use client"' src` must print just that path.
- **Theme.** The inline script in `layout.tsx` puts `light` or `dark` on
  `<html>` before first paint (stored choice in `localStorage.theme`, else the
  system theme). Colours are CSS variables in `globals.css` exposed as
  Tailwind colours `bg`, `fg`, `muted`, `faint`, `line` and `chip` (`bg-bg`,
  `text-muted`, `border-line`). Change a palette there; do not use `dark:`.
  `icon.svg` and `opengraph-image.tsx` cannot read CSS variables and copy the
  hex values, so change them with the palette.
- **Match the mockup.** The design was approved as is; do not restyle it.
- **Tailwind 4 is configured in CSS.** There is no `tailwind.config.js`.
  `sm:` is redefined as 520px, the mockup's phone breakpoint, and styles are
  mobile first. Tailwind only scans `src/`.
- **Dependencies.** Next.js, React and Tailwind only. Playwright is a
  verification tool installed by the skill, not a dependency.
- **Next.js docs.** This Next.js is newer than most training data. Read the
  guides in `node_modules/next/dist/docs/` before changing framework code.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
