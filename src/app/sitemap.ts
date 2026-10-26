import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// One page, one entry.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl.href }];
}
