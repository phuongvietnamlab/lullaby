import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createBookingSchema,
  validateDates,
  generateBookingCode,
  calculateTotalPrice,
} from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 bookings per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    const { allowed } = rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      roomTypeId,
      checkIn,
      checkOut,
      guestCount,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
    } = parsed.data;

    // Validate dates
    const dateValidation = validateDates(checkIn, checkOut);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Check availability via DB (prevent double-booking)
    const roomType = await db.roomType.findFirst({
      where: { slug: roomTypeId },
      include: { rooms: true },
    });

    // Also try by id if slug not found
    const rt = roomType || await db.roomType.findUnique({
      where: { id: roomTypeId },
      include: { rooms: true },
    });

    if (!rt) {
      return NextResponse.json(
        { error: "Room type not found" },
        { status: 404 }
      );
    }

    // Count overlapping active bookings
    const overlappingBookings = await db.booking.count({
      where: {
        roomTypeId: rt.id,
        status: { in: ["PENDING", "CONFIRMED", "CHECK_IN"] },
        checkIn: { lt: new Date(checkOut) },
        checkOut: { gt: new Date(checkIn) },
      },
    });

    const totalRooms = rt.rooms.length;
    if (overlappingBookings >= totalRooms) {
      return NextResponse.json(
        { error: "Room is no longer available for the selected dates" },
        { status: 409 }
      );
    }

    // Calculate pricing
    const pricing = calculateTotalPrice(roomTypeId, new Date(checkIn), new Date(checkOut));

    // Generate booking code
    const bookingCode = generateBookingCode();

    // Set expiration (48 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // Find or create guest
    let guest = await db.guest.findUnique({ where: { email: guestEmail } });
    if (!guest) {
      guest = await db.guest.create({
        data: {
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
        },
      });
    }

    // Create booking in database
    const booking = await db.booking.create({
      data: {
        bookingCode,
        guestId: guest.id,
        roomTypeId: rt.id,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guestCount,
        totalPrice: pricing.total,
        status: "PENDING",
        specialRequests: specialRequests || null,
        expiresAt,
      },
    });

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      success: true,
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        checkIn: checkIn,
        checkOut: checkOut,
        guestCount: booking.guestCount,
        totalPrice: Number(booking.totalPrice),
        nights,
        expiresAt: booking.expiresAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
