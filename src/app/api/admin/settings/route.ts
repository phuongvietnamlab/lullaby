import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";
import { revalidateSiteSettings } from "@/lib/revalidate";
import {
  SETTINGS_KEY,
  SETTINGS_CATEGORY,
  getSiteSettings,
  normaliseSettings,
} from "@/lib/data/settings";

export const dynamic = "force-dynamic";

/**
 * Hotel-wide settings. The shape, defaults and coercion rules live in
 * @/lib/data/settings so the public site reads exactly what this writes.
 */

export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    return NextResponse.json({ settings: await getSiteSettings() });
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
    const settings = normaliseSettings(body, await getSiteSettings());

    await db.siteConfig.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: settings, category: SETTINGS_CATEGORY },
      create: {
        key: SETTINGS_KEY,
        value: settings,
        category: SETTINGS_CATEGORY,
      },
    });

    revalidateSiteSettings();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
