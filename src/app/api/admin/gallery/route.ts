import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all gallery images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where = category && category !== "all" ? { category } : {};

    const images = await db.galleryImage.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch gallery images:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery images" },
      { status: 500 }
    );
  }
}

// POST: Add a new gallery image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, alt, altEn, category, roomTypeId } = body;

    if (!url || !category) {
      return NextResponse.json(
        { error: "URL and category are required" },
        { status: 400 }
      );
    }

    // Get the max sort order for the category
    const maxOrder = await db.galleryImage.findFirst({
      where: { category },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const image = await db.galleryImage.create({
      data: {
        url,
        alt: alt || null,
        altEn: altEn || null,
        category,
        roomTypeId: roomTypeId || null,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("Failed to create gallery image:", error);
    return NextResponse.json(
      { error: "Failed to create gallery image" },
      { status: 500 }
    );
  }
}

// PUT: Update gallery image (caption, order, category)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, alt, altEn, category, sortOrder, url } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    const image = await db.galleryImage.update({
      where: { id },
      data: {
        ...(alt !== undefined && { alt }),
        ...(altEn !== undefined && { altEn }),
        ...(category !== undefined && { category }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
        ...(url !== undefined && { url }),
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Failed to update gallery image:", error);
    return NextResponse.json(
      { error: "Failed to update gallery image" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a gallery image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    await db.galleryImage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete gallery image:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery image" },
      { status: 500 }
    );
  }
}
