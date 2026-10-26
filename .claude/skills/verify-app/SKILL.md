---
name: verify-app
description: Launch, drive and verify the About Me site (Next.js, one static page) end to end in headless Chromium, with screenshots and a JSON report as evidence. Use for every "verify it works" step, after any change to src/, before finishing a ticket, or when asked to check the page, the theme toggle, the links or the request log.
---

# verify-app

The app is one statically rendered route, `/`. It has no database, no API
routes and no data dir. Its only state is the `.next` build and the visitor's
`localStorage.theme`. This skill builds it from clean, serves it, drives it
in headless Chromium and keeps the evidence.

One command does the whole loop (Launch, Drive, Evidence, Cleanup):

```bash
bash .claude/skills/verify-app/run.sh            # run name defaults to run<timestamp>
bash .claude/skills/verify-app/run.sh my-change  # evidence in .fredrin/tmp/verify-app/my-change/
```

It exits 0 only when the build, the readiness check, the served copy check and
every driver check pass. The sections below are what it does, so you can run
or debug any step by hand.

## Launch

From the repo root (`run.sh` does all of this):

1. Tooling, once: `playwright-core@1.61.0` into `.fredrin/tmp/verify-app/pw`.
   That version matches the Chromium 1228 headless shell in
   `~/.cache/ms-playwright`. It is deliberately not in `package.json`.
2. Empty state: `[ -d node_modules ] || npm ci`, then `rm -rf .next`. For a
   fully fresh install, also `rm -rf node_modules` first. The browser side
   starts empty too: every scenario in `drive.mjs` opens a new context with
   empty `localStorage`.
3. Build: `npm run build` (runs `check:copy` first via `prebuild`). The route
   table must show `○ /` (Static).
4. Serve on a free port, bound to localhost, recording the pid:
   `node node_modules/next/dist/bin/next start -H 127.0.0.1 -p "$PORT" &`.
   Start `next` directly, not through `npm start`, so the pid is the server.
5. Ready means usable, not just listening: fetch `/` (curl retries until the
   port accepts) and require the served HTML to contain
   `<h1 ...>Prashant Raghu</h1>` and `aria-label="Toggle theme"`.

Sandboxed agent sessions:

- Each shell command gets its own network namespace and its background
  children are killed when it returns. Start the server and drive it in the
  same command, which is why `run.sh` is one script.
- If `~/.npm` is read only, `export npm_config_cache="$TMPDIR/npm-cache"`.
  npm needs network access to `registry.npmjs.org`.
- Chromium needs `--disable-gpu` for screenshots; `drive.mjs` passes it.

## Doctor

Read only. Changes nothing, starts nothing.

```bash
node --version                     # need >= 22.18: check:copy imports a .ts file
test -d node_modules && echo "deps: ok" || echo "deps: missing, run npm ci"
npm run check:copy                 # no hyphens or dashes in profile.ts copy
npm run lint
npx tsc --noEmit                   # after a build or dev run (needs next-env.d.ts)
grep -rl '"use client"' src        # must print only src/components/theme-toggle.tsx
ls -d ~/.cache/ms-playwright/chromium_headless_shell-1228 || echo "chromium: missing"
test -d .fredrin/tmp/verify-app/pw/node_modules/playwright-core && echo "driver: ok" || echo "driver: run.sh installs it"
test -f .next/BUILD_ID && echo "build: present" || echo "build: none"
for f in .fredrin/tmp/verify-app/*/server.pid; do
  [ -f "$f" ] && kill -0 "$(cat "$f")" 2>/dev/null && echo "still running: $(cat "$f") ($f)"
done
```

If Chromium is missing: `npx playwright-core@1.61.0 install chromium-headless-shell`.

## Drive

Routes: `/` only (plus the built in `/_not-found`). Dev server:
`npm run dev` on port 3000. Production: `npm run build && npm start`.

Driver: `node .claude/skills/verify-app/drive.mjs --url http://127.0.0.1:$PORT/ --out <dir> [--pw <playwright prefix>]`.
It prints one `PASS` or `FAIL` line per check and exits 1 on any failure.

Selectors and state, as they exist in this repo:

| What | Selector or state | Source |
| --- | --- | --- |
| Name | `h1` | `src/app/page.tsx` |
| Section headings | `h2`: Now, Work, Works with, Contact | `profile.headings` |
| Work entries | `main ol > li` (3) | `profile.work` |
| Skill chips | `main ul > li` (9) | `profile.skills` |
| Contact links | `section` with `h2` "Contact", then `a` | `profile.contact` |
| Footer links | `footer a` | `profile.footer` |
| Theme toggle | `button[aria-label="Toggle theme"]` | `src/components/theme-toggle.tsx` |
| Current theme | `html.light` or `html.dark` | inline script in `src/app/layout.tsx` |
| Stored choice | `localStorage.theme` = `"light"` or `"dark"` | `theme-toggle.tsx` |
| System theme | Playwright `colorScheme` on the context | `prefers-color-scheme` |

Served copy check (`run.sh` runs it): strip `<script>` and `<style>` bodies,
then tags, and grep the rest for `-`, `–` or `—`. Do not grep the raw HTML:
Next's inline RSC payload holds class names and chunk paths, which are not
copy.

```bash
curl -s "$URL" | perl -0pe 's/<(script|style)\b.*?<\/\1>//gis; s/<[^>]*>/\n/g' | grep -E '[-–—]'   # prints nothing
```

## Evidence

Each run writes to `.fredrin/tmp/verify-app/<run>/` (gitignored with the
rest of `.fredrin/`):

| File | Shows |
| --- | --- |
| `build.log` | the build, including the route table with `○ /` |
| `index.html`, `visible-text.txt` | the served page and the text the copy check read |
| `desktop-light.png`, `desktop-dark.png` | 1280px, full page, system theme light and dark |
| `phone-light.png`, `phone-dark.png` | 390px, full page, system theme light and dark |
| `toggle-after-reload.png` | the page after clicking the toggle and reloading |
| `report.json` | every check (`feature`, `name`, `pass`, observed state in `detail`) and every request the browser made |
| `server.log`, `server.pid` | the server this run started |

For each feature the report records the action, the resulting state, and the
side effects: `localStorage.theme` after a click, and the full request list
(every URL must share the page's origin). Compare the screenshots with the
mockup attached to ticket ABOU-O2L8EL. To attach evidence to a Fredrin
ticket: `./.fredrin/fredrin ticket upload <file> --label "<what it shows>"`.

## Cleanup

`run.sh` traps `EXIT` and kills only the server pid it started, so the
server stops on success, failure or Ctrl+C. By hand: `kill "$(cat <run>/server.pid)"`.
Never `pkill node` or `pkill next`: that would also kill a dev server
someone else is running. Keep the evidence directory. `.next` stays as the
last build, and `.fredrin/tmp/verify-app/pw` stays for the next run.

## Feature map

One file per top user facing feature, each with where it lives, how to drive
it and what must hold:

- [features/page-content.md](features/page-content.md): the page content and layout.
- [features/theme-toggle.md](features/theme-toggle.md): light and dark, the toggle, no flash.
- [features/links-and-footer.md](features/links-and-footer.md): contact and footer links, same origin requests.
