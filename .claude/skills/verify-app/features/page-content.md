# Page content

Everything a visitor reads on `/`: header (name, tagline, location line),
Now, Work (three entries), Works with (nine chips), Contact.

## Where it lives

- Copy: `src/content/profile.ts`. Every visible string comes from Prashant's
  resume, verbatim. Do not invent or reword facts.
- Markup and layout: `src/app/page.tsx` (a server component).
- Palette, fonts, the `mono` and `tap-target` utilities, the focus ring and
  the 520px phone breakpoint (`--breakpoint-sm`): `src/app/globals.css`.
- Contrast: `scripts/contrast.mjs` (`npm run check:contrast`) reads both
  palettes from `globals.css` and checks every text pair against WCAG AA
  (4.5:1; all text on the page is small, the 12px labels included).

## Drive

| Check | How | Expected |
| --- | --- | --- |
| Name | `h1` text | `Prashant Raghu` |
| Sections | `h2` text, in order | Now, Work, Works with, Contact |
| Work | `main ol > li` count | 3, newest first: 2026 to now, 2023 to 2026, 2021 to 2023 |
| Chips | `main ul > li` count | 9 |
| Copy rule | `body` innerText, and the served copy check in `run.sh` | no `-`, `–` or `—` anywhere |
| Structure | `html[lang]`, `h1`, `header`, `main`, `footer`, link text | `en`, one of each, every link named |
| Motion | computed `animation-name` and `transition-duration` under `prefers-reduced-motion: reduce` | nothing animates |
| Phone layout | viewport 320, 390 and 430, both themes | `scrollWidth <= clientWidth` (no horizontal scroll); work grid is one column |
| Tap targets | at 320, 390 and 430, hit test outwards from each button and link's centre with `elementFromPoint` | at least 44 by 44px; the toggle is drawn 32px, the links 16 to 28px tall |
| Contrast | `npm run check:contrast`, which `prebuild` runs, so every build and `run.sh` run it | every pair PASS in light and dark |
| Lighthouse | `LIGHTHOUSE=1 run.sh` | Performance, Accessibility, Best Practices and SEO each 95 or more |
| Static | `build.log` route table | `○ /` |

Palette values that pass AA (the faint grey was moved the least it could):

| Token | Light (on `#fafafa`) | Dark (on `#0b0b0b`) |
| --- | --- | --- |
| `fg` | `#111111`, 18.09:1 | `#ededed`, 16.81:1 |
| `muted` | `#6b6b6b`, 5.11:1 (4.68:1 on chip `#f0f0f0`) | `#9a9a9a`, 6.99:1 (6.43:1 on chip `#161616`) |
| `faint` | `#737373`, 4.54:1 (was `#a3a3a3`, 2.42:1) | `#797979`, 4.52:1 (was `#5c5c5c`, 2.94:1) |

## Look

Compare `desktop-*.png` and `phone-390-*.png` with the mockup screenshots on
ticket ABOU-O2L8EL (`v2-desktop-light.png`, `v2-phone-dark.png`). Key
values: content column 600px (max width 648px, 24px side padding), 72px top
padding on desktop and 48px on phones, 48px between sections (40px on
phones), work rows in a 112px + 1fr grid that becomes one column under
520px, monospace for the location line, dates, chips and footer.
