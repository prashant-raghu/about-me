# Keyboard and screen readers

Everything on the page works from the keyboard: Tab reaches the theme toggle,
then every link in page order, and each stop shows a focus ring in both
themes. The toggle tells a screen reader which theme is on.

## Where it lives

- Focus ring: the `:focus-visible` rule in `src/app/globals.css`, a 2px
  solid outline in `--fg` with a 2px offset. It follows the toggle's round
  border and contrasts with the background in both palettes (18:1 light,
  17:1 dark).
- Toggle name and state: `src/components/theme-toggle.tsx`. The name is
  always "Dark theme"; `aria-pressed` is `"true"` in dark and `"false"` in
  light, so a screen reader says "Dark theme, toggle button, pressed". It is
  absent in the server HTML, because the server cannot know the theme, and
  set on hydration.
- Tab stops: the toggle, then the links in `src/app/page.tsx`. No
  `tabindex` anywhere; the order is the DOM order.

## Drive

| Action | Expected state |
| --- | --- |
| Press Tab six times from a fresh load, light and dark, at 390px | focus goes Dark theme, Email, GitHub, LinkedIn, Fredrin, Source |
| At each stop | `:focus-visible` matches; computed outline `solid 2px rgb(17, 17, 17)` in light, `solid 2px rgb(237, 237, 237)` in dark |
| Click the toggle, reload, click again | `aria-pressed` reads `false`, `true`, `true`, `false` |

`focus-<theme>-<n>.png` holds each stop with its ring, cropped 12px around
the element.
