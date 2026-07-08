import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all blog categories
export async function GET() {
  try {
    const categories = await db.blogCategory.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch blog categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog categories" },
      { status: 500 }
    );
  }
}
