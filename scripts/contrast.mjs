// Contrast guard: reads both palettes from globals.css and checks every text
// colour against the background it sits on, using the WCAG 2 contrast ratio.
// All text on the page is small (the 12px labels included), so every pair
// needs AA's 4.5:1. Exits 1 if a pair fails or the two dark palettes differ.
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

// The custom properties declared in the first `<selector> {` block. Only
// opaque six digit hex is understood; anything else stops the check rather
// than being skipped.
function palette(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`contrast: no "${selector} {" block in globals.css`);
  const block = css.slice(start, css.indexOf("}", start));
  const colours = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (!/^#[0-9a-f]{6}$/i.test(value.trim())) {
      throw new Error(`contrast: --${name} in "${selector}" is ${value.trim()}; use a six digit hex colour`);
    }
    colours[name] = value.trim();
  }
  return colours;
}

const palettes = {
  light: palette(":root"),
  dark: palette(":root.dark"),
};

// Foreground, background, where the page uses it.
const PAIRS = [
  ["fg", "bg", "name, body copy, contact links, focus ring"],
  ["muted", "bg", "tagline, employers, summaries, footer links, toggle icon"],
  ["faint", "bg", "section labels, location, dates, footer credit"],
  ["muted", "chip", "skill chips"],
];
const AA = 4.5;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failed = false;

// The no JavaScript fallback repeats the dark palette; it must not drift.
const fallback = palette(":root:not(.light)");
if (JSON.stringify(fallback) !== JSON.stringify(palettes.dark)) {
  console.error("FAIL  the prefers-color-scheme fallback differs from :root.dark");
  failed = true;
}

for (const [theme, colours] of Object.entries(palettes)) {
  for (const [fg, bg, use] of PAIRS) {
    for (const token of [fg, bg]) {
      if (!colours[token]) throw new Error(`contrast: the ${theme} palette has no --${token}`);
    }
    const value = ratio(colours[fg], colours[bg]);
    const pass = value >= AA;
    failed ||= !pass;
    console.log(
      `${pass ? "PASS" : "FAIL"}  ${theme.padEnd(5)}  ${fg.padEnd(5)} ${colours[fg]} on ${bg.padEnd(4)} ${colours[bg]}  ${value.toFixed(2).padStart(5)}:1  (${use})`,
    );
  }
}

if (failed) {
  console.error(`check:contrast: a text colour is under ${AA}:1 in src/app/globals.css`);
  process.exit(1);
}
console.log(`check:contrast: every text colour meets WCAG AA (${AA}:1) in both themes`);
