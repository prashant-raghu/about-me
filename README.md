# about-me

Prashant Raghu's About Me page. One static page built from his resume: light
and dark, fast on a phone, no tracking.

Built with Next.js (App Router), TypeScript and Tailwind CSS. There is no
database and no server code; the page is prerendered at build time.

## Run it

Needs Node 22.18 or newer and npm.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # checks the copy, then builds; / must show as ○ (Static)
npm start       # serves the build on http://localhost:3000
npm run lint
```

## Edit the content

Every word on the page lives in `src/content/profile.ts`. Visible copy has no
hyphens or dashes ("2023 to 2026", not "2023–2026"); `npm run check:copy`
enforces that and runs before every build.

## Verify

```bash
bash .claude/skills/verify-app/run.sh
```

Builds from clean, serves the page, drives it in headless Chromium (both
themes at 1280px and 390px, the theme toggle, every link, the request log)
and saves screenshots and a report under `.fredrin/tmp/verify-app/`. See
`.claude/skills/verify-app/SKILL.md`.

## Deploy

Vercel builds every push to `main` of
https://github.com/prashant-raghu/about-me with the default Next.js settings.

Set `NEXT_PUBLIC_SITE_URL` in the Vercel project to the public URL (see
`.env.example`). It is the base for the canonical link, the share image URL,
`robots.txt` and the sitemap; unset, Vercel's production domain is used.
Preview deployments serve their own share image URL.

Created with [Fredrin](https://fredrin.com).
