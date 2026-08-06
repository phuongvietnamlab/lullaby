import { NextRequest, NextResponse } from "next/server";
import {
  checkAvailability,
  checkAvailabilitySchema,
  validateDates,
  calculateStayPrice,
  expirePendingBookings,
} from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 checks per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "unknown";
    const { allowed } = rateLimit(`check-avail:${ip}`, 20, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "rateLimited" },
        { status: 429 }
      );
    }

    // Expire old pending bookings first so their rooms become bookable again
    await expirePendingBookings();

    const body = await request.json();
    const parsed = checkAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", code: "invalidInput", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { checkIn, checkOut, guestCount, roomSlug } = parsed.data;

    // Validate dates
    const dateValidation = validateDates(checkIn, checkOut);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error, code: dateValidation.code },
        { status: 400 }
      );
    }

    // Check availability (filtered to a single room type when roomSlug is set)
    const available = await checkAvailability(checkIn, checkOut, guestCount, roomSlug);

    // Price each available room off its own base price
    const results = available.map((room) => {
      const pricing = calculateStayPrice(
        room.basePrice,
        new Date(checkIn),
        new Date(checkOut)
      );
      return {
        roomId: room.roomTypeId,
        roomSlug: room.slug,
        roomName: room.nameKey,
        basePrice: room.basePrice,
        totalPrice: pricing.total,
        nights: pricing.nights,
        maxGuests: room.maxGuests,
        size: room.size,
        available: room.available,
        images: room.images,
        amenities: room.amenities,
        highlights: room.highlights,
      };
    });

    return NextResponse.json({
      checkIn,
      checkOut,
      guestCount,
      roomSlug: roomSlug ?? null,
      rooms: results,
    });
  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "serverError" },
      { status: 500 }
    );
  }
}
