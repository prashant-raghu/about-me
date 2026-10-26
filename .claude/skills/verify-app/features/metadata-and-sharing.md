# Metadata and sharing

What a shared link, a browser tab and a crawler see: the title and
description, the canonical URL, the OpenGraph and Twitter card tags with a
1200×630 preview image, the favicon, `robots.txt` and the sitemap.

## Where it lives

- Tags: `metadata` in `src/app/layout.tsx`. Title and description are
  `profile.name` and `profile.tagline` from `src/content/profile.ts`.
- Site URL: `src/lib/site-url.ts` sets `metadataBase`, the sitemap entry and
  the sitemap line in robots. `NEXT_PUBLIC_SITE_URL` wins, then
  `VERCEL_PROJECT_PRODUCTION_URL`, then `http://localhost:3000`. Only the
  origin is kept and a bare domain gets `https://`. It is read at build time,
  so changing it needs a rebuild.
- Preview image: `src/app/opengraph-image.tsx` (`ImageResponse`, the dark
  palette, name and tagline from `profile.ts`, the bundled font only). Next
  adds the `og:image*` and `twitter:image*` tags for it. On a Vercel preview
  build (`VERCEL_ENV=preview`) Next resolves that image against the preview
  deployment URL, not the site URL; everything else keeps the site URL.
- Favicon: `src/app/icon.svg`, a "PR" monogram in the page's text colour on
  the page background; its own media query follows the system theme.
- Crawlers: `src/app/robots.ts` (allow everything, point at the sitemap) and
  `src/app/sitemap.ts` (the one route).

## Drive

`run.sh` does not check these routes; it only requires `○ /` in the route
table. Check them by hand against a server started as in Launch, in the same
shell command that starts it, with `BASE=${URL%/}` (`$URL` ends in `/`).

```bash
for path in /icon.svg /opengraph-image /robots.txt /sitemap.xml; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path") $path"
done
curl -s "$BASE/" | grep -oE '<title>[^<]*</title>|<(meta|link)[^>]*>'
curl -s "$BASE/robots.txt"; curl -s "$BASE/sitemap.xml"
curl -s "$BASE/opengraph-image" -o og.png
```

| Check | Expected |
| --- | --- |
| Static | `build.log` route table shows `○` for `/icon.svg`, `/opengraph-image`, `/robots.txt`, `/sitemap.xml` |
| Routes | `200` for each of the four paths |
| Head | `<title>Prashant Raghu</title>`, `description`, `link rel="canonical"`, `og:title`, `og:description`, `og:url`, `og:image` (+ type, width 1200, height 630, alt), `twitter:card` = `summary_large_image`, `twitter:image`, `link rel="icon"` to `/icon.svg?...` |
| Site URL | canonical, `og:url`, `og:image`, the robots `Sitemap:` line and the sitemap `<loc>` all start with the site URL (`http://localhost:3000` when nothing is set) |
| Image | `og.png` is a 1200×630 PNG: dark background, name and tagline readable, no hyphens or dashes |
| No tracking | `report.json` `requests` from `drive.mjs` are same origin only (headless Chromium does not fetch the favicon, so `/icon.svg` is not in the list) |

`robots.txt` is exactly:

```txt
User-Agent: *
Allow: /

Sitemap: http://localhost:3000/sitemap.xml
```

After a deploy, paste the public URL into a link preview tool to see the card
as a chat app renders it.
