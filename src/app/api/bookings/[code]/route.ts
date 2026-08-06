import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

/** Mask an address so the guest can recognise it without it being harvestable. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "";
  const head = local.slice(0, 2);
  return `${head}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Booking codes are only 6 random characters, so an unthrottled lookup is
    // brute-forceable into a guest-data dump.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = rateLimit(`booking-lookup:${ip}`, 20, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

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
        // Masked: the code alone is not proof of identity (D-06)
        guestEmail: maskEmail(booking.guest.email),
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
