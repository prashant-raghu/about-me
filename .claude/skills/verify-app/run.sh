#!/usr/bin/env bash
# End to end: clean build, serve on a free port, wait until the page is usable,
# drive it, then stop only the server this script started. Evidence stays in
# .fredrin/tmp/verify-app/<run>/.
#
#   bash .claude/skills/verify-app/run.sh [run name]
#
# Everything runs in one shell on purpose: in sandboxed agent sessions each
# command gets its own network namespace, so a server started by one command
# is unreachable from the next.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
ROOT=.fredrin/tmp/verify-app
RUN="$ROOT/${1:-run$(date +%Y%m%d%H%M%S)}"
PW="$ROOT/pw"
mkdir -p "$RUN"
export NEXT_TELEMETRY_DISABLED=1

# Tooling: playwright-core 1.61.0 drives the Chromium 1228 headless shell
# already in ~/.cache/ms-playwright. Kept out of package.json on purpose.
if [ ! -d "$PW/node_modules/playwright-core" ]; then
  npm install --prefix "$PW" --no-save --no-package-lock playwright-core@1.61.0
fi

# Launch from empty state. The app has no database or data dir; its only
# state is the .next build and the browser's localStorage, and drive.mjs
# opens a fresh browser context (empty storage) for every scenario.
[ -d node_modules ] || npm ci
rm -rf .next
npm run build 2>&1 | tee "$RUN/build.log"
grep -E '○ /$' "$RUN/build.log" > /dev/null || { echo "FAIL  / is not static in the route table"; exit 1; }

PORT=$(node -e 'const s=require("net").createServer().listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')
URL="http://127.0.0.1:$PORT/"
node node_modules/next/dist/bin/next start -H 127.0.0.1 -p "$PORT" > "$RUN/server.log" 2>&1 &
SERVER=$!
echo "$SERVER" > "$RUN/server.pid"
trap 'kill "$SERVER" 2>/dev/null || true' EXIT

# Ready means usable: the served HTML holds the name and the toggle, not just a 200.
curl -sf --retry 30 --retry-connrefused --retry-delay 1 "$URL" -o "$RUN/index.html"
grep -q '<h1[^>]*>Prashant Raghu</h1>' "$RUN/index.html"
grep -q 'aria-label="Toggle theme"' "$RUN/index.html"
echo "READY  $URL (pid $SERVER)"

# Copy check on the served HTML. Drop <script> and <style> bodies first: the
# inline RSC payload holds class names and chunk paths, which are not copy.
perl -0pe 's/<(script|style)\b.*?<\/\1>//gis; s/<[^>]*>/\n/g' "$RUN/index.html" > "$RUN/visible-text.txt"
if grep -nE '[-–—]' "$RUN/visible-text.txt"; then
  echo "FAIL  hyphens or dashes in served visible text"
  exit 1
fi
echo "PASS  no hyphens or dashes in served visible text"

node .claude/skills/verify-app/drive.mjs --url "$URL" --out "$RUN" --pw "$PW"
