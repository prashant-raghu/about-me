# Contact and footer links

The Contact section's three links and the footer's credit and source links,
plus the no tracking rule: the page requests nothing outside its own origin.

## Where it lives

- Hrefs and labels: `profile.contact` and `profile.footer` in
  `src/content/profile.ts`.
- Markup: the Contact `Section` and the `footer` in `src/app/page.tsx`.

## Drive

| Selector | Expected hrefs, in order |
| --- | --- |
| Contact `section` (with `h2` "Contact") `a` | `mailto:prashantraghu999@gmail.com`, `https://github.com/prashant-raghu`, `https://linkedin.com/in/prashant-raghu` |
| `footer a` | `https://fredrin.com` (text "Fredrin", after "Built with"), `https://github.com/prashant-raghu/about-me` (text "Source") |

These values are hard coded in `drive.mjs` from the ticket, not read from
`profile.ts`, so a wrong value in the data file fails the run.

## No tracking

`drive.mjs` records every request from every scenario and fails if any URL's
origin differs from the page's. `report.json` keeps the full list. Expect only
`/` and `/_next/static/...` (plus `/favicon.ico` once a favicon exists). No
analytics, third party scripts, cookies or external font requests.
