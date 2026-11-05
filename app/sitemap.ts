import type { MetadataRoute } from "next";
import { ARTICLE_DOCS } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // artikel contoh (sample) tidak dimasukkan: halamannya juga ditandai noindex
  const articles = ARTICLE_DOCS.filter((a) => !a.sample).map((a) => ({ url: `${SITE_URL}/artikel/${a.slug}`, lastModified: a.date }));
  return [{ url: SITE_URL, changeFrequency: "weekly", priority: 1 }, ...articles];
}
