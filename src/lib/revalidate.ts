import { revalidatePath } from "next/cache";

/**
 * Public pages are statically prerendered, so an admin write does not show up
 * until the affected paths are rebuilt. Without this, publishing a post or
 * changing the hotel's phone number only took effect on the next deploy.
 *
 * Each helper is best-effort: a revalidation failure must never turn a
 * successful save into an error response.
 */

function safeRevalidate(path: string, type?: "page" | "layout") {
  try {
    revalidatePath(path, type);
  } catch (error) {
    console.error(`Failed to revalidate ${path}:`, error);
  }
}

/** Blog listing and post pages, both locales. */
export function revalidateBlog() {
  safeRevalidate("/[locale]/blog", "page");
  safeRevalidate("/[locale]/blog/[slug]", "page");
}

/** Room list and detail pages, plus the home page's featured rooms. */
export function revalidateRooms() {
  safeRevalidate("/[locale]/rooms", "page");
  safeRevalidate("/[locale]/rooms/[slug]", "page");
  safeRevalidate("/[locale]", "page");
}

export function revalidatePromotions() {
  safeRevalidate("/[locale]/promotions", "page");
}

export function revalidateGallery() {
  safeRevalidate("/[locale]/gallery", "page");
}

/**
 * Settings feed the footer (rendered by the locale layout) and the site
 * metadata, so every page under /[locale] has to be rebuilt.
 */
export function revalidateSiteSettings() {
  safeRevalidate("/[locale]", "layout");
}

/** Homepage / about copy stored in site_config. */
export function revalidateContent() {
  safeRevalidate("/[locale]", "page");
  safeRevalidate("/[locale]/about", "page");
}
