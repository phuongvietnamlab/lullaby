import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Find booking by code in database
    const booking = await db.booking.findFirst({
      where: {
        bookingCode: { equals: code, mode: "insensitive" },
      },
      include: {
        guest: true,
        roomType: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Auto-expire if needed
    if (
      booking.status === "PENDING" &&
      booking.expiresAt &&
      new Date() > booking.expiresAt
    ) {
      await db.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED" },
      });
      booking.status = "EXPIRED";
    }

    return NextResponse.json({
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        guestCount: booking.guestCount,
        guestName: booking.guest.name,
        guestEmail: booking.guest.email,
        totalPrice: Number(booking.totalPrice),
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt.toISOString(),
        expiresAt: booking.expiresAt?.toISOString(),
        room: booking.roomType
          ? {
              name: booking.roomType.slug,
              slug: booking.roomType.slug,
              images: [{ src: (booking.roomType.images as string[])?.[0] || "", alt: booking.roomType.nameEn }],
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
