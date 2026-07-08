import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch revisions for an entity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const revisions = await db.contentRevision.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ revisions });
  } catch (error) {
    console.error("Failed to fetch revisions:", error);
    return NextResponse.json(
      { error: "Failed to fetch revisions" },
      { status: 500 }
    );
  }
}

// POST: Create a new revision
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, data, createdBy, note } = body;

    if (!entityType || !entityId || !data) {
      return NextResponse.json(
        { error: "entityType, entityId, and data are required" },
        { status: 400 }
      );
    }

    const revision = await db.contentRevision.create({
      data: {
        entityType,
        entityId,
        data,
        createdBy: createdBy || null,
        note: note || null,
      },
    });

    return NextResponse.json({ revision }, { status: 201 });
  } catch (error) {
    console.error("Failed to create revision:", error);
    return NextResponse.json(
      { error: "Failed to create revision" },
      { status: 500 }
    );
  }
}
