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
  React's dev remount. The button's name is fixed, "Dark theme", and
  `aria-pressed` follows `<html>`'s class through `useSyncExternalStore`
  (the WAI ARIA toggle button pattern: the state changes, the name does not).
- `src/app/globals.css`: light palette on `:root`, dark on `:root.dark`, and
  a `prefers-color-scheme: dark` fallback on `:root:not(.light)` for visitors
  without JavaScript.

## Drive

| Action | Expected state | Side effects |
| --- | --- | --- |
| Open with system light, nothing stored | `html.light`, body `rgb(250, 250, 250)`, `aria-pressed="false"` | none |
| Open with system dark, nothing stored | `html.dark`, body `rgb(11, 11, 11)` | none |
| Click `button[aria-label="Dark theme"]` from light | `html.dark`, `aria-pressed="true"` | `localStorage.theme = "dark"` |
| Reload | `html.dark`, already set when `<body>` is first created (no flash), `aria-pressed="true"` | none |
| Click again | `html.light`, `aria-pressed="false"` | `localStorage.theme = "light"` |
| System dark with `theme = "light"` stored | `html.light`, light background | none |
| Load with the stored theme opposite to the system, both ways | `DOMContentLoaded` screenshot has the stored background; no painted frame has the system one | none |
| JavaScript disabled, system dark | dark background (CSS fallback); toggle is inert | none |

`drive.mjs` proves "no flash" two ways. An init script records `<html>`'s
classes the moment `<body>` exists, before anything can paint. And a CDP
screencast samples the frames Chromium paints while the page loads with the
stored theme opposite to the system: the top left pixel of each must never be
the system theme's background (the first frame is the blank tab, white or
`rgb(18, 18, 18)`). Screencast frames are paced by acks, so a single frame
flash could fall between samples; the `<body>` check is the exact one.
Removing the inline script fails both checks. The `DOMContentLoaded`
screenshot alone does not catch it, because hydration has already set the
class by then.

If `localStorage` throws (private mode), the toggle still flips the theme for
the current page and the system theme applies on the next load.
