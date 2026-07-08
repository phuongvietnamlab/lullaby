import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch site config by key or category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const category = searchParams.get("category");

    if (key) {
      const config = await db.siteConfig.findUnique({ where: { key } });
      return NextResponse.json({ config });
    }

    if (category) {
      const configs = await db.siteConfig.findMany({
        where: { category },
      });
      return NextResponse.json({ configs });
    }

    const configs = await db.siteConfig.findMany();
    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Failed to fetch site config:", error);
    return NextResponse.json(
      { error: "Failed to fetch site config" },
      { status: 500 }
    );
  }
}

// PUT: Upsert a site config entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, category } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const config = await db.siteConfig.upsert({
      where: { key },
      create: {
        key,
        value,
        category: category || "general",
      },
      update: {
        value,
        category: category || undefined,
      },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Failed to update site config:", error);
    return NextResponse.json(
      { error: "Failed to update site config" },
      { status: 500 }
    );
  }
}
