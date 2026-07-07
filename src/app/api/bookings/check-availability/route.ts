import { NextRequest, NextResponse } from "next/server";
import {
  checkAvailability,
  checkAvailabilitySchema,
  validateDates,
  calculateTotalPrice,
  expirePendingBookings,
} from "@/lib/booking";

export async function POST(request: NextRequest) {
  try {
    // Expire old pending bookings first
    expirePendingBookings();

    const body = await request.json();
    const parsed = checkAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { checkIn, checkOut, guestCount } = parsed.data;

    // Validate dates
    const dateValidation = validateDates(checkIn, checkOut);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Check availability
    const available = checkAvailability(checkIn, checkOut, guestCount);

    // Calculate pricing for each available room
    const results = available.map(({ roomId, room, available: availCount }) => {
      const pricing = calculateTotalPrice(roomId, new Date(checkIn), new Date(checkOut));
      return {
        roomId,
        roomSlug: room.slug,
        roomName: room.nameKey,
        basePrice: room.price,
        totalPrice: pricing.total,
        nights: pricing.nights,
        maxGuests: room.maxGuests,
        size: room.size,
        available: availCount,
        images: room.images,
        amenities: room.amenities,
        highlights: room.highlights,
      };
    });

    return NextResponse.json({
      checkIn,
      checkOut,
      guestCount,
      rooms: results,
    });
  } catch (error) {
    console.error("Check availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
