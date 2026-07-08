import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET: Fetch all room types from DB
export async function GET() {
  try {
    const roomTypes = await db.roomType.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { rooms: true } },
      },
    });

    return NextResponse.json({ roomTypes });
  } catch (error) {
    console.error("Failed to fetch room types:", error);
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 }
    );
  }
}

// PUT: Update a room type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      nameEn,
      slug,
      description,
      descriptionEn,
      basePrice,
      maxGuests,
      bedType,
      size,
      images,
      amenities,
      isActive,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Room type ID is required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness if changed
    if (slug) {
      const existing = await db.roomType.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A room type with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const roomType = await db.roomType.update({
      where: { id },
      data: {
        name,
        nameEn,
        slug,
        description: description || null,
        descriptionEn: descriptionEn || null,
        basePrice: basePrice ? parseFloat(basePrice) : undefined,
        maxGuests: maxGuests ? parseInt(maxGuests) : undefined,
        bedType: bedType || null,
        size: size ? parseInt(size) : null,
        images: images ?? undefined,
        amenities: amenities ?? undefined,
        isActive: isActive ?? undefined,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
      },
    });

    return NextResponse.json({ roomType });
  } catch (error) {
    console.error("Failed to update room type:", error);
    return NextResponse.json(
      { error: "Failed to update room type" },
      { status: 500 }
    );
  }
}

// POST: Create a new room type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      nameEn,
      slug,
      description,
      descriptionEn,
      basePrice,
      maxGuests,
      bedType,
      size,
      images,
      amenities,
    } = body;

    if (!name || !nameEn || !slug || !basePrice) {
      return NextResponse.json(
        { error: "Name, nameEn, slug, and basePrice are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await db.roomType.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A room type with this slug already exists" },
        { status: 409 }
      );
    }

    const roomType = await db.roomType.create({
      data: {
        name,
        nameEn,
        slug,
        description: description || null,
        descriptionEn: descriptionEn || null,
        basePrice: parseFloat(basePrice),
        maxGuests: maxGuests ? parseInt(maxGuests) : 2,
        bedType: bedType || null,
        size: size ? parseInt(size) : null,
        images: images ?? [],
        amenities: amenities ?? [],
      },
    });

    return NextResponse.json({ roomType }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room type:", error);
    return NextResponse.json(
      { error: "Failed to create room type" },
      { status: 500 }
    );
  }
}
