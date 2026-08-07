import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";
import { revalidateRooms } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

/**
 * Individual physical rooms, as opposed to /api/admin/rooms which manages room
 * *types*. Availability counts these, so the two must not be confused.
 */

const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "OUT_OF_ORDER",
] as const;
type RoomStatus = (typeof ROOM_STATUSES)[number];

const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "CHECK_IN"] as const;

export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const rooms = await db.room.findMany({
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
      include: {
        roomType: { select: { id: true, name: true, nameEn: true, slug: true } },
      },
    });

    return NextResponse.json({
      rooms: rooms.map((room) => ({
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        status: room.status,
        notes: room.notes || "",
        roomTypeId: room.roomTypeId,
        roomTypeName: room.roomType.name,
        roomTypeSlug: room.roomType.slug,
      })),
    });
  } catch (error) {
    console.error("Admin rooms fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdminApi(["SUPER_ADMIN", "MANAGER"]);
    if (guard instanceof NextResponse) return guard;

    const body = await request.json();
    const roomNumber =
      typeof body.roomNumber === "string" ? body.roomNumber.trim() : "";
    const roomTypeId = typeof body.roomTypeId === "string" ? body.roomTypeId : "";

    if (!roomNumber || !roomTypeId) {
      return NextResponse.json(
        { error: "roomNumber and roomTypeId are required" },
        { status: 400 }
      );
    }

    const status = (body.status || "AVAILABLE") as RoomStatus;
    if (!ROOM_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid room status" }, { status: 400 });
    }

    const roomType = await db.roomType.findUnique({ where: { id: roomTypeId } });
    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    const clash = await db.room.findUnique({ where: { roomNumber } });
    if (clash) {
      return NextResponse.json(
        { error: "A room with this number already exists" },
        { status: 409 }
      );
    }

    const room = await db.room.create({
      data: {
        roomNumber,
        roomTypeId,
        floor: Number.isFinite(Number(body.floor)) ? Number(body.floor) : 1,
        status,
        notes: body.notes ? String(body.notes) : null,
      },
    });

    revalidateRooms();

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error("Admin room create error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdminApi(["SUPER_ADMIN", "MANAGER"]);
    if (guard instanceof NextResponse) return guard;

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const current = await db.room.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (body.status !== undefined && !ROOM_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid room status" }, { status: 400 });
    }

    if (body.roomNumber !== undefined) {
      const roomNumber = String(body.roomNumber).trim();
      if (!roomNumber) {
        return NextResponse.json(
          { error: "roomNumber cannot be empty" },
          { status: 400 }
        );
      }
      if (roomNumber !== current.roomNumber) {
        const clash = await db.room.findFirst({
          where: { roomNumber, NOT: { id } },
        });
        if (clash) {
          return NextResponse.json(
            { error: "A room with this number already exists" },
            { status: 409 }
          );
        }
      }
    }

    if (body.roomTypeId !== undefined) {
      const roomType = await db.roomType.findUnique({
        where: { id: String(body.roomTypeId) },
      });
      if (!roomType) {
        return NextResponse.json(
          { error: "Room type not found" },
          { status: 404 }
        );
      }
    }

    const room = await db.room.update({
      where: { id },
      data: {
        roomNumber:
          body.roomNumber === undefined ? undefined : String(body.roomNumber).trim(),
        roomTypeId:
          body.roomTypeId === undefined ? undefined : String(body.roomTypeId),
        floor:
          body.floor === undefined || !Number.isFinite(Number(body.floor))
            ? undefined
            : Number(body.floor),
        status: body.status === undefined ? undefined : (body.status as RoomStatus),
        notes: body.notes === undefined ? undefined : body.notes ? String(body.notes) : null,
      },
    });

    revalidateRooms();

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Admin room update error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdminApi(["SUPER_ADMIN", "MANAGER"]);
    if (guard instanceof NextResponse) return guard;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const room = await db.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Booking.roomId is optional, so Prisma nulls it on delete rather than
    // blocking. That is fine for finished stays (the room type is still on the
    // booking) but would silently unassign a live reservation — refuse those
    // and let staff retire the room via OUT_OF_ORDER instead.
    const liveBookings = await db.booking.count({
      where: { roomId: id, status: { in: [...BLOCKING_STATUSES] } },
    });
    if (liveBookings > 0) {
      return NextResponse.json(
        {
          error: `This room has ${liveBookings} active booking(s). Set it to OUT_OF_ORDER instead of deleting it.`,
        },
        { status: 409 }
      );
    }

    await db.room.delete({ where: { id } });

    revalidateRooms();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin room delete error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
