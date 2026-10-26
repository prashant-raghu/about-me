// Drives the served About Me page in headless Chromium and checks every
// feature in the feature map. Writes screenshots and report.json to --out and
// exits 1 if any check fails.
//
//   node .claude/skills/verify-app/drive.mjs --url http://127.0.0.1:<port> \
//     --out .fredrin/tmp/verify-app/<run> --pw .fredrin/tmp/verify-app/pw
//
// --pw is the npm prefix holding playwright-core (see SKILL.md, Launch). It is
// not a project dependency on purpose.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    out: { type: "string" },
    pw: { type: "string", default: ".fredrin/tmp/verify-app/pw" },
  },
});
if (!args.url || !args.out) {
  console.error("usage: drive.mjs --url <served page> --out <evidence dir> [--pw <playwright prefix>]");
  process.exit(2);
}

const { chromium } = createRequire(resolve(args.pw, "noop.js"))("playwright-core");

// What the ticket specifies. Kept here, not read from profile.ts, so a wrong
// value in the data file fails the run.
const EXPECTED = {
  name: "Prashant Raghu",
  headings: ["Now", "Work", "Works with", "Contact"],
  workEntries: 3,
  chips: 9,
  contact: [
    "mailto:prashantraghu999@gmail.com",
    "https://github.com/prashant-raghu",
    "https://linkedin.com/in/prashant-raghu",
  ],
  footer: ["https://fredrin.com", "https://github.com/prashant-raghu/about-me"],
  // Tab stops in order: the toggle, the contact links, the footer links.
  tabOrder: ["Dark theme", "Email", "GitHub", "LinkedIn", "Fredrin", "Source"],
};
const BACKGROUND = { light: "rgb(250, 250, 250)", dark: "rgb(11, 11, 11)" };
const TEXT = { light: "rgb(17, 17, 17)", dark: "rgb(237, 237, 237)" };
const PHONES = [320, 390, 430];
const TAP = 44;
const DASH = /[-‐-―−]/;
const TOGGLE = 'button[aria-label="Dark theme"]';

const out = resolve(args.out);
mkdirSync(out, { recursive: true });
const origin = new URL(args.url).origin;
const requests = new Set();
const checks = [];

function check(feature, name, pass, detail) {
  checks.push({ feature, name, pass: Boolean(pass), detail });
  const suffix = detail === undefined ? "" : `  ${JSON.stringify(detail)}`;
  console.log(`${pass ? "PASS" : "FAIL"}  [${feature}] ${name}${suffix}`);
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Without --disable-gpu, screenshots fail inside sandboxed sessions
// ("Unable to capture screenshot").
const browser = await chromium.launch({ args: ["--disable-gpu"] });

// beforeGoto runs once the page exists, before navigation starts.
async function open({ width, height = 900, colorScheme = "light", javaScriptEnabled = true, reducedMotion, storedTheme, beforeGoto }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, javaScriptEnabled, reducedMotion });
  context.on("request", (request) => requests.add(request.url()));
  if (storedTheme) {
    await context.addInitScript((theme) => localStorage.setItem("theme", theme), storedTheme);
  }
  const page = await context.newPage();
  await beforeGoto?.(page);
  await page.goto(args.url, { waitUntil: "networkidle" });
  return { context, page };
}

function themeState(page) {
  return page.evaluate(() => ({
    classes: document.documentElement.className,
    background: getComputedStyle(document.body).backgroundColor,
    scrollWidth: document.documentElement.scrollWidth,
    // clientWidth leaves out a classic scrollbar; innerWidth would not.
    clientWidth: document.documentElement.clientWidth,
  }));
}

// The top left pixel of each base64 PNG, decoded by a canvas in a blank page.
async function cornerPixels(context, images) {
  const page = await context.newPage();
  const result = await page.evaluate(
    (list) =>
      Promise.all(
        list.map(async (data) => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const g = canvas.getContext("2d");
          g.drawImage(image, 0, 0);
          const [r, gr, b] = g.getImageData(4, 4, 1, 1).data;
          return `rgb(${r}, ${gr}, ${b})`;
        }),
      ),
    images,
  );
  await page.close();
  return result;
}

try {
  // Every width in both system themes: the page follows the system and never
  // scrolls sideways.
  for (const width of [1280, ...PHONES]) {
    const label = width === 1280 ? "desktop" : `phone-${width}`;
    for (const scheme of ["light", "dark"]) {
      const { context, page } = await open({ width, colorScheme: scheme });
      const state = await themeState(page);
      check("theme-toggle", `${label} follows a ${scheme} system`, state.classes === scheme && state.background === BACKGROUND[scheme], state);
      check("page-content", `${label} ${scheme} has no horizontal scroll`, state.scrollWidth <= state.clientWidth, state);
      await page.screenshot({ path: join(out, `${label}-${scheme}.png`), fullPage: true });
      await context.close();
    }
  }

  // Page content.
  {
    const { context, page } = await open({ width: 1280, reducedMotion: "reduce" });
    check("page-content", "h1 is the name", (await page.locator("h1").textContent()) === EXPECTED.name);
    const headings = await page.locator("h2").allTextContents();
    check("page-content", "section headings in order", same(headings, EXPECTED.headings), headings);
    check("page-content", "work entries", (await page.locator("main ol > li").count()) === EXPECTED.workEntries);
    check("page-content", "skill chips", (await page.locator("main ul > li").count()) === EXPECTED.chips);
    const dashed = (await page.locator("body").innerText()).split("\n").filter((line) => DASH.test(line));
    check("page-content", "no hyphens or dashes in rendered copy", dashed.length === 0, dashed);
    const structure = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      h1: document.querySelectorAll("h1").length,
      landmarks: ["header", "main", "footer"].map((tag) => document.querySelectorAll(tag).length),
      unnamedLinks: [...document.links].filter((a) => !a.textContent.trim()).length,
    }));
    check(
      "page-content",
      'lang="en", one h1, one header, main and footer, every link named',
      structure.lang === "en" && structure.h1 === 1 && same(structure.landmarks, [1, 1, 1]) && structure.unnamedLinks === 0,
      structure,
    );
    // prefers-reduced-motion is respected by having no motion at all.
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll("*")]
        .filter((el) => {
          const style = getComputedStyle(el);
          return style.animationName !== "none" || style.transitionDuration.split(",").some((d) => parseFloat(d) > 0);
        })
        .map((el) => el.tagName.toLowerCase()),
    );
    check("page-content", "no transitions or animations under reduced motion", moving.length === 0, moving);
    await context.close();
  }

  // Tap targets: hit test outwards from each target's centre, so the size is
  // what a finger can hit (the tap-target box), not what is drawn.
  for (const width of PHONES) {
    const { context, page } = await open({ width, height: 700 });
    const targets = await page.locator("button, a").evaluateAll((elements) =>
      elements.map((el) => {
        el.scrollIntoView({ block: "center" });
        const box = el.getBoundingClientRect();
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        const reach = (dx, dy) => {
          let n = 0;
          while (n < 100 && el.contains(document.elementFromPoint(x + dx * (n + 1), y + dy * (n + 1)))) n++;
          return n;
        };
        return {
          name: el.getAttribute("aria-label") ?? el.textContent,
          drawn: [Math.round(box.width), Math.round(box.height)],
          hit: [reach(-1, 0) + reach(1, 0) + 1, reach(0, -1) + reach(0, 1) + 1],
        };
      }),
    );
    const small = targets.filter((t) => t.hit[0] < TAP || t.hit[1] < TAP);
    check("page-content", `phone-${width} tap targets are at least ${TAP}px both ways`, targets.length === EXPECTED.tabOrder.length && small.length === 0, targets);
    await context.close();
  }

  // Keyboard: Tab walks the toggle, then every link in page order, and every
  // stop shows a 2px ring in the text colour.
  for (const scheme of ["light", "dark"]) {
    const { context, page } = await open({ width: 390, colorScheme: scheme });
    const stops = [];
    for (let i = 1; i <= EXPECTED.tabOrder.length; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          name: el.getAttribute("aria-label") ?? el.textContent,
          focusVisible: el.matches(":focus-visible"),
          ring: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
        };
      });
      // Focus left the page early: the order check below fails with what was reached.
      if (!stop) break;
      stops.push(stop);
      const box = await page.locator(":focus").boundingBox();
      const pad = 12;
      await page.screenshot({
        path: join(out, `focus-${scheme}-${i}.png`),
        clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.width + 2 * pad, height: box.height + 2 * pad },
      });
    }
    const names = stops.map((stop) => stop.name);
    check("keyboard", `${scheme}: Tab reaches the toggle, then every link in order`, same(names, EXPECTED.tabOrder), names);
    const ring = `solid 2px ${TEXT[scheme]}`;
    check(
      "keyboard",
      `${scheme}: every stop shows a 2px ring in the text colour`,
      stops.length === EXPECTED.tabOrder.length && stops.every((stop) => stop.focusVisible && stop.ring === ring),
      stops.map((stop) => stop.ring),
    );
    await context.close();
  }

  // Links.
  {
    const { context, page } = await open({ width: 1280 });
    const hrefs = (locator) => locator.evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    const contactSection = page.locator("section", { has: page.locator("h2", { hasText: "Contact" }) });
    const contact = await hrefs(contactSection.locator("a"));
    check("links-and-footer", "contact hrefs", same(contact, EXPECTED.contact), contact);
    const footer = await hrefs(page.locator("footer a"));
    check("links-and-footer", "footer hrefs", same(footer, EXPECTED.footer), footer);
    await context.close();
  }

  // Theme toggle: flip, persist across reload with no flash, flip back.
  {
    const { context, page } = await open({ width: 1280, colorScheme: "light" });
    const isDark = () => page.evaluate(() => document.documentElement.classList.contains("dark"));
    const stored = () => page.evaluate(() => localStorage.getItem("theme"));
    const pressed = [];
    const recordPressed = async () => pressed.push(await page.locator(TOGGLE).getAttribute("aria-pressed"));

    const before = await isDark();
    await recordPressed();
    await page.locator(TOGGLE).click();
    const after = await isDark();
    await recordPressed();
    check("theme-toggle", "click flips html.dark", before === false && after === true, { before, after });
    check("theme-toggle", "click stores the choice", (await stored()) === "dark", await stored());

    // Record <html>'s classes the moment <body> exists, before anything paints.
    await context.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        window.__classesAtBody = document.documentElement.className;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload({ waitUntil: "networkidle" });
    const atBody = await page.evaluate(() => window.__classesAtBody);
    check("theme-toggle", "reload keeps dark, set before <body> exists", atBody === "dark" && (await isDark()), atBody);
    await recordPressed();
    await page.screenshot({ path: join(out, "toggle-after-reload.png") });

    await page.locator(TOGGLE).click();
    await recordPressed();
    check("theme-toggle", "second click flips back to light", !(await isDark()) && (await stored()) === "light");
    check("theme-toggle", "aria-pressed follows the theme: light, dark, reload, light", same(pressed, ["false", "true", "true", "false"]), pressed);
    await context.close();
  }

  {
    const { context, page } = await open({ width: 1280, colorScheme: "dark", storedTheme: "light" });
    const state = await themeState(page);
    check("theme-toggle", "stored light beats a dark system", state.classes === "light" && state.background === BACKGROUND.light, state);
    await context.close();
  }

  // First frame: the stored choice is opposite to the system theme. The
  // screenshot taken at DOMContentLoaded shows the stored background, and no
  // screencast frame sampled while the page loads shows the system one.
  // Screencast frames are paced by acks, so this samples paints rather than
  // recording every one; the <body> class check above covers the gap.
  for (const [system, stored] of [["light", "dark"], ["dark", "light"]]) {
    const frames = [];
    let atDomContentLoaded;
    const { context } = await open({
      width: 390,
      colorScheme: system,
      storedTheme: stored,
      beforeGoto: async (page) => {
        const cdp = await page.context().newCDPSession(page);
        cdp.on("Page.screencastFrame", ({ data, sessionId }) => {
          frames.push(data);
          cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
        });
        await cdp.send("Page.startScreencast", { format: "png" });
        page.once("domcontentloaded", () => {
          atDomContentLoaded = page.screenshot({ path: join(out, `first-frame-${stored}-over-${system}.png`) });
        });
      },
    });
    const shot = await atDomContentLoaded;
    const [atLoad, ...painted] = await cornerPixels(context, [shot.toString("base64"), ...frames]);
    check("theme-toggle", `stored ${stored} over a ${system} system: ${stored} at DOMContentLoaded`, atLoad === BACKGROUND[stored], atLoad);
    check(
      "theme-toggle",
      `stored ${stored} over a ${system} system: no painted frame is ${system}`,
      painted.includes(BACKGROUND[stored]) && !painted.includes(BACKGROUND[system]),
      painted,
    );
    await context.close();
  }

  {
    const { context, page } = await open({ width: 390, colorScheme: "dark", javaScriptEnabled: false });
    const background = await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor);
    check("theme-toggle", "without JavaScript a dark system still gets dark", background === BACKGROUND.dark, background);
    await context.close();
  }
} finally {
  await browser.close();
}

const foreign = [...requests].filter((url) => !url.startsWith("data:") && new URL(url).origin !== origin);
check("links-and-footer", "every request stays on the page's origin", foreign.length === 0, foreign);

const failed = checks.filter((c) => !c.pass);
writeFileSync(
  join(out, "report.json"),
  JSON.stringify({ url: args.url, at: new Date().toISOString(), passed: failed.length === 0, checks, requests: [...requests].sort() }, null, 2) + "\n",
);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed. Evidence in ${out}`);
process.exit(failed.length === 0 ? 0 : 1);
