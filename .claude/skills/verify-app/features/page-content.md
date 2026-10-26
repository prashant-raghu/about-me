# Page content

Everything a visitor reads on `/`: header (name, tagline, location line),
Now, Work (three entries), Works with (nine chips), Contact.

## Where it lives

- Copy: `src/content/profile.ts`. Every visible string comes from Prashant's
  resume, verbatim. Do not invent or reword facts.
- Markup and layout: `src/app/page.tsx` (a server component).
- Palette, fonts, the `mono` utility and the 520px phone breakpoint
  (`--breakpoint-sm`): `src/app/globals.css`.

## Drive

| Check | How | Expected |
| --- | --- | --- |
| Name | `h1` text | `Prashant Raghu` |
| Sections | `h2` text, in order | Now, Work, Works with, Contact |
| Work | `main ol > li` count | 3, newest first: 2026 to now, 2023 to 2026, 2021 to 2023 |
| Chips | `main ul > li` count | 9 |
| Copy rule | `body` innerText, and the served copy check in `run.sh` | no `-`, `–` or `—` anywhere |
| Phone layout | viewport 390 and 320, `scrollWidth - clientWidth` | 0 (no horizontal scroll); work grid is one column |
| Static | `build.log` route table | `○ /` |

## Look

Compare `desktop-*.png` and `phone-*.png` with the mockup screenshots on
ticket ABOU-O2L8EL (`v2-desktop-light.png`, `v2-phone-dark.png`). Key
values: content column 600px (max width 648px, 24px side padding), 72px top
padding on desktop and 48px on phones, 48px between sections (40px on
phones), work rows in a 112px + 1fr grid that becomes one column under
520px, monospace for the location line, dates, chips and footer.
