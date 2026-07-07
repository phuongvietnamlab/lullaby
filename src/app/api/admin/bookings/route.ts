import { NextResponse } from "next/server";
import { bookingsStore, expirePendingBookings } from "@/lib/booking";
import { mockBookings } from "@/lib/admin/mock-data";
import { rooms } from "@/lib/data/rooms";

export async function GET() {
  // Expire old pending bookings
  expirePendingBookings();

  // Merge real bookings from the in-memory store with mock data
  const realBookings = bookingsStore.map((b) => {
    const roomType = rooms.find((r) => r.id === b.roomTypeId);
    const nights = Math.ceil(
      (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return {
      id: b.id,
      bookingCode: b.bookingCode,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      roomTypeName: roomType?.nameKey || "Unknown",
      roomNumber: "-",
      checkIn: b.checkIn.split("T")[0],
      checkOut: b.checkOut.split("T")[0],
      nights,
      totalPrice: b.totalPrice,
      status: b.status.toLowerCase(),
      createdAt: b.createdAt,
      specialRequests: b.specialRequests || "",
    };
  });

  // Combine: real bookings first (newest), then mock data
  const allBookings = [...realBookings.reverse(), ...mockBookings];

  return NextResponse.json({ bookings: allBookings });
}
