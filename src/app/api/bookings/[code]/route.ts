import { NextRequest, NextResponse } from "next/server";
import { bookingsStore, expirePendingBookings } from "@/lib/booking";
import { rooms } from "@/lib/data/rooms";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Expire old pending bookings first
    expirePendingBookings();

    // Find booking by code
    const booking = bookingsStore.find(
      (b) => b.bookingCode.toLowerCase() === code.toLowerCase()
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Get room info
    const room = rooms.find((r) => r.id === booking.roomTypeId);

    return NextResponse.json({
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestCount: booking.guestCount,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        totalPrice: booking.totalPrice,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt,
        expiresAt: booking.expiresAt,
        room: room
          ? {
              name: room.nameKey,
              slug: room.slug,
              images: room.images,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
