// The site's origin: metadataBase, robots.txt and the sitemap all build on it.
// NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is the fallback;
// locally the dev server, so a build never fails. A bare domain gets https://
// and any path is dropped, because the page is served at /.
function toOrigin(value: string) {
  return new URL(new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).origin);
}

export const siteUrl = toOrigin(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000",
);
