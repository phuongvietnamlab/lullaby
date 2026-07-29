import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const verifySchema = z.object({
  bookingCode: z.string().trim().min(3).max(60),
  email: z.email(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 verification attempts per IP per hour
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = rateLimit(`review-verify:${ip}`, 10, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "rateLimited" }, { status: 429 });
    }

    const parsed = verifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }

    // Case-insensitive booking lookup with guest + roomType (D-01)
    const booking = await db.booking.findFirst({
      where: {
        bookingCode: { equals: parsed.data.bookingCode, mode: "insensitive" },
      },
      include: { guest: true, roomType: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "errorInvalidCode" }, { status: 404 });
    }

    // Case-insensitive email match — email used ONLY for verification, never returned (D-01, D-06)
    if (booking.guest.email.toLowerCase() !== parsed.data.email.toLowerCase()) {
      return NextResponse.json({ error: "errorEmailMismatch" }, { status: 403 });
    }

    // Eligibility: only checked-out / completed stays may review (D-02)
    if (!["CHECK_OUT", "COMPLETED"].includes(booking.status)) {
      return NextResponse.json({ error: "errorIneligible" }, { status: 403 });
    }

    // Pre-existing-review UX pre-check (D-10). Authoritative guard is the
    // submit route's bookingId @unique constraint; this is UX only.
    const existing = await db.review.findUnique({
      where: { bookingId: booking.id },
    });
    if (existing) {
      return NextResponse.json({ error: "errorAlreadyReviewed" }, { status: 409 });
    }

    // PII-free summary — no guest email returned (D-06). Both room-type names
    // so the client picks by locale (Pitfall 6): name = VI, nameEn = EN.
    return NextResponse.json({
      booking: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        guestName: booking.guest.name,
        roomTypeId: booking.roomTypeId,
        roomTypeName: booking.roomType?.name,
        roomTypeNameEn: booking.roomType?.nameEn,
      },
    });
  } catch (error) {
    console.error("Verify review error:", error);
    return NextResponse.json({ error: "errorSubmit" }, { status: 500 });
  }
}
