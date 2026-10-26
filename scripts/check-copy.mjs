// Copy guard: fails when any visible string in the profile contains a hyphen
// or dash. Links (`href` values) are skipped; hyphens in URLs are fine.
// Runs before every build via the `prebuild` script.
import { profile } from "../src/content/profile.ts";

// Hyphen minus, the Unicode hyphens and dashes (U+2010 to U+2015), minus sign.
const DASH = /[-‐-―−]/;

const failures = [];

function walk(value, path) {
  if (typeof value === "string") {
    if (DASH.test(value)) failures.push(`  ${path}: ${JSON.stringify(value)}`);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key !== "href") walk(child, path ? `${path}.${key}` : key);
    }
  }
}

walk(profile, "");

if (failures.length > 0) {
  console.error("check:copy: hyphens or dashes found in visible copy:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("check:copy: no hyphens or dashes in visible copy");
