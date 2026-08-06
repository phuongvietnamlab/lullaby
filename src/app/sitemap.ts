import type { MetadataRoute } from "next";
import { getAllRoomSlugs } from "@/lib/data/rooms";
import { getAllPostSlugs } from "@/lib/data/blog";

const BASE_URL = "https://lullabyskyvillahahalong.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["vi", "en"];
  const roomSlugs = getAllRoomSlugs();
  // Published posts, so anything an admin writes gets indexed
  const postSlugs = await getAllPostSlugs();

  const staticPages = [
    "",
    "/rooms",
    "/gallery",
    "/about",
    "/contact",
    "/booking",
    "/blog",
    "/promotions",
    "/reviews",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : 0.8,
      });
    }

    // Room detail pages
    for (const slug of roomSlugs) {
      entries.push({
        url: `${BASE_URL}/${locale}/rooms/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Blog posts (each row serves both locales)
  for (const { slug, locale } of postSlugs) {
    entries.push({
      url: `${BASE_URL}/${locale}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
