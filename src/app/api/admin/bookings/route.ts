import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all bookings from database, ordered by newest first
    const bookings = await db.booking.findMany({
      include: {
        guest: true,
        roomType: true,
        room: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = bookings.map((b) => {
      const nights = Math.ceil(
        (b.checkOut.getTime() - b.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: b.id,
        bookingCode: b.bookingCode,
        guestName: b.guest.name,
        guestEmail: b.guest.email,
        guestPhone: b.guest.phone || "",
        roomTypeName: b.roomType.nameEn,
        roomNumber: b.room?.roomNumber || "-",
        checkIn: b.checkIn.toISOString().split("T")[0],
        checkOut: b.checkOut.toISOString().split("T")[0],
        nights,
        totalPrice: Number(b.totalPrice),
        status: b.status.toLowerCase(),
        createdAt: b.createdAt.toISOString(),
        specialRequests: b.specialRequests || "",
      };
    });

    return NextResponse.json({ bookings: formatted });
  } catch (error) {
    console.error("Admin bookings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
