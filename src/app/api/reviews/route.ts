import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const submitSchema = z.object({
  bookingId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(20).max(1000),
  guestName: z.string().trim().min(1).max(120),
  // Photo count capped server-side ≤5 (D-07); stores URL strings only (Pitfall 4)
  photos: z.array(z.string().url()).max(5).default([]),
  // Honeypot — must be empty; non-empty = bot (D-11)
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: NextRequest) {
  // Rate limiting: 5 submissions per IP per hour
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = rateLimit(`review-submit:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  const parsed = submitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }

  // Honeypot hit — silent fake success so bots are not tipped off (Open Q2).
  // Never writes to the DB.
  if (parsed.data.website) {
    return NextResponse.json({ success: true });
  }

  try {
    // Re-fetch and re-check server-side — never trust the client's earlier
    // verify (T-09-05: a user can POST directly to this route).
    const booking = await db.booking.findUnique({
      where: { id: parsed.data.bookingId },
      include: { guest: true },
    });

    if (!booking || !["CHECK_OUT", "COMPLETED"].includes(booking.status)) {
      return NextResponse.json({ error: "errorIneligible" }, { status: 403 });
    }

    // Persist PENDING review (REV-02, REV-04). Email is never persisted (D-06).
    await db.review.create({
      data: {
        bookingId: booking.id,
        guestId: booking.guestId,
        roomTypeId: booking.roomTypeId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        guestName: parsed.data.guestName,
        photos: parsed.data.photos,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    // bookingId @unique violation is the authoritative race-safe duplicate
    // guard (REV-05, Pitfall 2) — not a read-then-write check.
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "errorAlreadyReviewed" }, { status: 409 });
    }
    console.error("Create review error:", e);
    return NextResponse.json({ error: "errorSubmit" }, { status: 500 });
  }
}
