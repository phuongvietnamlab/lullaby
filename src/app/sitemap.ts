import type { MetadataRoute } from "next";
import { getAllRoomSlugs } from "@/lib/data/rooms";

const BASE_URL = "https://hasanahotel.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["vi", "en"];
  const roomSlugs = getAllRoomSlugs();

  const staticPages = [
    "",
    "/rooms",
    "/gallery",
    "/about",
    "/contact",
    "/booking",
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

  return entries;
}
