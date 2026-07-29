import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth-utils";

export async function GET() {
  try {
    // Verify admin session (guard the list explicitly — D-11 + threat model T-10-03)
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await db.review.findMany({
      include: {
        roomType: true,
        guest: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      guestName: r.guestName ?? r.guest?.name ?? "-",
      roomTypeName: r.roomType?.nameEn ?? "-",
      photos: r.photos,
      response: r.response,
      rejectReason: r.rejectReason,
      status: r.status.toLowerCase(),
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ reviews: formatted });
  } catch (error) {
    console.error("Admin reviews fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
