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
};
const BACKGROUND = { light: "rgb(250, 250, 250)", dark: "rgb(11, 11, 11)" };
const DASH = /[-‐-―−]/;
const TOGGLE = 'button[aria-label="Toggle theme"]';

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

async function open({ width, height = 900, colorScheme = "light", javaScriptEnabled = true, storedTheme }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, javaScriptEnabled });
  context.on("request", (request) => requests.add(request.url()));
  if (storedTheme) {
    await context.addInitScript((theme) => localStorage.setItem("theme", theme), storedTheme);
  }
  const page = await context.newPage();
  await page.goto(args.url, { waitUntil: "networkidle" });
  return { context, page };
}

function themeState(page) {
  return page.evaluate(() => ({
    classes: document.documentElement.className,
    background: getComputedStyle(document.body).backgroundColor,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
}

try {
  // Screenshots: both themes at desktop and phone widths, following the system.
  for (const [label, width] of [["desktop", 1280], ["phone", 390]]) {
    for (const scheme of ["light", "dark"]) {
      const { context, page } = await open({ width, colorScheme: scheme });
      const state = await themeState(page);
      check("theme-toggle", `${label} follows a ${scheme} system`, state.classes === scheme && state.background === BACKGROUND[scheme], state);
      check("page-content", `${label} ${scheme} has no horizontal overflow`, state.overflow <= 0, state.overflow);
      await page.screenshot({ path: join(out, `${label}-${scheme}.png`), fullPage: true });
      await context.close();
    }
  }

  // Page content.
  {
    const { context, page } = await open({ width: 1280 });
    check("page-content", "h1 is the name", (await page.locator("h1").textContent()) === EXPECTED.name);
    const headings = await page.locator("h2").allTextContents();
    check("page-content", "section headings in order", same(headings, EXPECTED.headings), headings);
    check("page-content", "work entries", (await page.locator("main ol > li").count()) === EXPECTED.workEntries);
    check("page-content", "skill chips", (await page.locator("main ul > li").count()) === EXPECTED.chips);
    const dashed = (await page.locator("body").innerText()).split("\n").filter((line) => DASH.test(line));
    check("page-content", "no hyphens or dashes in rendered copy", dashed.length === 0, dashed);
    await context.close();
  }

  {
    const { context, page } = await open({ width: 320 });
    check("page-content", "320px phone has no horizontal overflow", (await themeState(page)).overflow <= 0);
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

    const before = await isDark();
    await page.locator(TOGGLE).click();
    const after = await isDark();
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
    await page.screenshot({ path: join(out, "toggle-after-reload.png") });

    await page.locator(TOGGLE).click();
    check("theme-toggle", "second click flips back to light", !(await isDark()) && (await stored()) === "light");
    await context.close();
  }

  {
    const { context, page } = await open({ width: 1280, colorScheme: "dark", storedTheme: "light" });
    const state = await themeState(page);
    check("theme-toggle", "stored light beats a dark system", state.classes === "light" && state.background === BACKGROUND.light, state);
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
