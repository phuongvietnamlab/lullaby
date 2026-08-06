import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/**
 * Hotel-wide settings, stored as one `site_config` row under the "general"
 * category. Payment credentials deliberately live in /api/admin/payment, which
 * is role-gated and masks the secret.
 */

const SETTINGS_KEY = "general_settings";
const SETTINGS_CATEGORY = "general";

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

const DEFAULTS: SiteSettings = {
  hotelName: "Lullaby Sky Villa & Spa",
  tagline: "Luxury Living by the Bay",
  email: "info@lullabyskyvillahahalong.com",
  phone: "",
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

/** Merge caller input over the current values, coercing every field. */
function normalise(input: unknown, base: SiteSettings): SiteSettings {
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

async function readSettings(): Promise<SiteSettings> {
  const row = await db.siteConfig.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return DEFAULTS;
  return normalise(row.value, DEFAULTS);
}

export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    return NextResponse.json({ settings: await readSettings() });
  } catch (error) {
    console.error("Admin settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdminApi(["SUPER_ADMIN", "MANAGER"]);
    if (guard instanceof NextResponse) return guard;

    const body = await request.json();
    // Merge over what is stored so a partial save cannot blank the rest
    const settings = normalise(body, await readSettings());

    await db.siteConfig.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: settings, category: SETTINGS_CATEGORY },
      create: {
        key: SETTINGS_KEY,
        value: settings,
        category: SETTINGS_CATEGORY,
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
