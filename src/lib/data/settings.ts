import { db } from "@/lib/db";

/**
 * Hotel-wide settings, stored as one `site_config` row under the "general"
 * category and edited at /admin/settings.
 *
 * Shared by the admin API and the public site so both agree on the shape,
 * the defaults and the coercion rules. Payment credentials deliberately live
 * elsewhere (/api/admin/payment), role-gated and masked.
 */

export const SETTINGS_KEY = "general_settings";
export const SETTINGS_CATEGORY = "general";

export type SiteSettings = {
  hotelName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  defaultLocale: string;
  socialMedia: { facebook: string; instagram: string; twitter: string };
  seo: { metaTitle: string; metaDescription: string; ogImage: string };
  bookingPolicy: {
    cancellationHours: number;
    depositPercentage: number;
    maxAdvanceBookingDays: number;
    childAgeLimit: number;
  };
};

export const DEFAULT_SETTINGS: SiteSettings = {
  hotelName: "Lullaby Sky Villa & Spa",
  tagline: "Luxury Living by the Bay",
  email: "info@lullabyskyvillahahalong.com",
  phone: "+84 (0) 203 xxx xxxx",
  address: "Ha Long, Quang Ninh, Vietnam",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  currency: "VND",
  defaultLocale: "vi",
  socialMedia: { facebook: "", instagram: "", twitter: "" },
  seo: { metaTitle: "", metaDescription: "", ogImage: "" },
  bookingPolicy: {
    cancellationHours: 48,
    depositPercentage: 30,
    maxAdvanceBookingDays: 365,
    childAgeLimit: 12,
  },
};

function str(value: unknown, fallback: string, maxLength = 500): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, maxLength);
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

/**
 * Only accept http(s) URLs, so a stored value can never become javascript:.
 * An explicitly empty string clears the link; anything unparseable keeps what
 * was already saved.
 */
function url(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  const raw = str(value, "");
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fallback;
    return parsed.toString();
  } catch {
    return fallback;
  }
}

function timeOfDay(value: unknown, fallback: string): string {
  const raw = str(value, "");
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(raw) ? raw : fallback;
}

/** Merge caller input over `base`, coercing every field. */
export function normaliseSettings(input: unknown, base: SiteSettings): SiteSettings {
  const body = (input ?? {}) as Record<string, unknown>;
  const social = (body.socialMedia ?? {}) as Record<string, unknown>;
  const seo = (body.seo ?? {}) as Record<string, unknown>;
  const policy = (body.bookingPolicy ?? {}) as Record<string, unknown>;

  return {
    hotelName: str(body.hotelName, base.hotelName, 200),
    tagline: str(body.tagline, base.tagline, 200),
    email: str(body.email, base.email, 200),
    phone: str(body.phone, base.phone, 50),
    address: str(body.address, base.address, 300),
    checkInTime: timeOfDay(body.checkInTime, base.checkInTime),
    checkOutTime: timeOfDay(body.checkOutTime, base.checkOutTime),
    currency: str(body.currency, base.currency, 10),
    defaultLocale: ["vi", "en"].includes(str(body.defaultLocale, ""))
      ? str(body.defaultLocale, base.defaultLocale, 5)
      : base.defaultLocale,
    socialMedia: {
      facebook: url(social.facebook, base.socialMedia.facebook),
      instagram: url(social.instagram, base.socialMedia.instagram),
      twitter: url(social.twitter, base.socialMedia.twitter),
    },
    seo: {
      metaTitle: str(seo.metaTitle, base.seo.metaTitle, 200),
      metaDescription: str(seo.metaDescription, base.seo.metaDescription, 400),
      ogImage: str(seo.ogImage, base.seo.ogImage, 500),
    },
    bookingPolicy: {
      cancellationHours: num(
        policy.cancellationHours,
        base.bookingPolicy.cancellationHours,
        0,
        720
      ),
      depositPercentage: num(
        policy.depositPercentage,
        base.bookingPolicy.depositPercentage,
        0,
        100
      ),
      maxAdvanceBookingDays: num(
        policy.maxAdvanceBookingDays,
        base.bookingPolicy.maxAdvanceBookingDays,
        1,
        1095
      ),
      childAgeLimit: num(policy.childAgeLimit, base.bookingPolicy.childAgeLimit, 0, 18),
    },
  };
}

/**
 * Current settings, falling back to the defaults when the row is missing or
 * the DB is unreachable — the public site must render either way.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const row = await db.siteConfig.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) return DEFAULT_SETTINGS;
    return normaliseSettings(row.value, DEFAULT_SETTINGS);
  } catch (error) {
    console.error("Failed to read site settings, using defaults:", error);
    return DEFAULT_SETTINGS;
  }
}
