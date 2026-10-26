# Theme toggle

Light and dark. With no stored choice the page follows `prefers-color-scheme`
(live). The header button overrides it and the choice persists in
`localStorage.theme`.

## Where it lives

- `src/app/layout.tsx`: the inline `<head>` script. It runs before `<body>`
  is parsed and adds `light` or `dark` to `<html>`: the stored choice if
  there is one, else the system theme.
- `src/components/theme-toggle.tsx`: the only `"use client"` file. The click
  handler flips the class and stores the choice; a layout effect follows
  system changes while nothing is stored and re-applies the class after
  React's dev remount.
- `src/app/globals.css`: light palette on `:root`, dark on `:root.dark`, and
  a `prefers-color-scheme: dark` fallback on `:root:not(.light)` for visitors
  without JavaScript.

## Drive

| Action | Expected state | Side effects |
| --- | --- | --- |
| Open with system light, nothing stored | `html.light`, body `rgb(250, 250, 250)` | none |
| Open with system dark, nothing stored | `html.dark`, body `rgb(11, 11, 11)` | none |
| Click `button[aria-label="Toggle theme"]` from light | `html.dark` | `localStorage.theme = "dark"` |
| Reload | `html.dark`, already set when `<body>` is first created (no flash) | none |
| Click again | `html.light` | `localStorage.theme = "light"` |
| System dark with `theme = "light"` stored | `html.light`, light background | none |
| JavaScript disabled, system dark | dark background (CSS fallback); toggle is inert | none |

`drive.mjs` proves "no flash" with an init script that records
`<html>`'s classes the moment `<body>` exists, before anything can paint.

If `localStorage` throws (private mode), the toggle still flips the theme for
the current page and the system theme applies on the next load.
