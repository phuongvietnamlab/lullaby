import { NextRequest, NextResponse } from "next/server";
import {
  createBookingSchema,
  validateDates,
  isRoomTypeAvailable,
  generateBookingCode,
  calculateTotalPrice,
  bookingsStore,
  expirePendingBookings,
} from "@/lib/booking";

export async function POST(request: NextRequest) {
  try {
    // Expire old pending bookings first
    expirePendingBookings();

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

    // Check availability (prevent double-booking)
    if (!isRoomTypeAvailable(roomTypeId, checkIn, checkOut)) {
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

    // Create booking record
    const booking = {
      id: crypto.randomUUID(),
      bookingCode,
      roomId: roomTypeId,
      roomTypeId,
      checkIn,
      checkOut,
      guestCount,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests: specialRequests || "",
      totalPrice: pricing.total,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store booking (TODO: Replace with Prisma create in production)
    bookingsStore.push(booking);

    // TODO: Send confirmation email via Resend
    // await sendBookingConfirmationEmail(booking);

    return NextResponse.json({
      success: true,
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guestCount: booking.guestCount,
        totalPrice: booking.totalPrice,
        nights: pricing.nights,
        expiresAt: booking.expiresAt,
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
