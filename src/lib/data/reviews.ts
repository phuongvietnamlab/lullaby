/**
 * Reviews data helpers
 * Provides APPROVED-only guest reviews for public pages.
 * Real async Prisma reads (D-11); every query hard-filters status: "APPROVED"
 * so PENDING/REJECTED rows can never surface (Security V4).
 * Aggregates are computed dynamically from live APPROVED reviews (D-06 / SEO-04).
 */

import { db } from "@/lib/db";

export type PublicReview = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  roomTypeName: string;
  stayDate: string;
  verified: boolean;
  response?: string;
  createdAt: string;
};

/**
 * Row shape returned by the review queries below (with booking/roomType/guest
 * relations included). Kept local so the mapper stays type-safe without
 * leaking Prisma internals to callers.
 */
type ReviewRow = {
  id: string;
  guestName: string | null;
  rating: number;
  comment: string | null;
  bookingId: string | null;
  response: string | null;
  createdAt: Date;
  guest: { name: string };
  roomType: { name: string } | null;
  booking: { checkOut: Date } | null;
};

/**
 * Map a raw DB review row to the public-facing shape.
 * - guestName: editable override falls back to the linked guest's name.
 * - roomTypeName: VI name (locale-aware room-name display is resolved by the caller).
 * - stayDate: derived from the linked booking's checkOut, else createdAt.
 * - verified: true when the review came from a real booking (D-04).
 * - comment body is passed through verbatim (D-05 — never translated).
 */
function toPublicReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    guestName: row.guestName ?? row.guest.name,
    rating: row.rating,
    comment: row.comment ?? "",
    roomTypeName: row.roomType?.name ?? "",
    stayDate: (row.booking?.checkOut ?? row.createdAt).toISOString(),
    verified: row.bookingId != null,
    response: row.response ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Featured APPROVED reviews for public display (D-01):
 * most recent, rating >= 4, with a non-empty comment.
 */
export async function getApprovedReviews(limit = 6): Promise<PublicReview[]> {
  try {
    const rows = await db.review.findMany({
      where: {
        status: "APPROVED",
        rating: { gte: 4 },
        comment: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
      include: { booking: true, roomType: true, guest: true },
    });

    return rows
      .filter((r) => (r.comment ?? "").trim().length > 0)
      .slice(0, limit)
      .map(toPublicReview);
  } catch (error) {
    console.error("Failed to fetch approved reviews:", error);
    return [];
  }
}

/**
 * Site-wide average rating + count across ALL APPROVED reviews
 * (null-roomTypeId reviews are included — Open Question 2 resolution).
 * Average rounded to 1 decimal, preserving the original rounding (D-06 / SEO-04).
 */
export async function getAverageRating(): Promise<{ average: number; count: number }> {
  try {
    const raw = await db.review.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });

    return {
      average: raw._avg.rating == null ? 0 : Math.round(raw._avg.rating * 10) / 10,
      count: raw._count,
    };
  } catch (error) {
    console.error("Failed to fetch average rating:", error);
    return { average: 0, count: 0 };
  }
}

/**
 * Per-room-type APPROVED review summary (DISP-02 / SEO-02).
 * A passed roomTypeId is always non-null, so there is no null-leak (Pitfall 5).
 */
export async function getRoomTypeReviewSummary(
  roomTypeId: string
): Promise<{ average: number; count: number; reviews: PublicReview[] }> {
  try {
    const [agg, rows] = await Promise.all([
      db.review.aggregate({
        where: { status: "APPROVED", roomTypeId },
        _avg: { rating: true },
        _count: true,
      }),
      db.review.findMany({
        where: { status: "APPROVED", roomTypeId },
        orderBy: { createdAt: "desc" },
        include: { booking: true, roomType: true, guest: true },
      }),
    ]);

    return {
      average: agg._avg.rating == null ? 0 : Math.round(agg._avg.rating * 10) / 10,
      count: agg._count,
      reviews: rows.map(toPublicReview),
    };
  } catch (error) {
    console.error("Failed to fetch room type review summary:", error);
    return { average: 0, count: 0, reviews: [] };
  }
}

/**
 * Per-room-type aggregate summaries across all room types that have APPROVED
 * reviews (D-09, consumed by /llms.txt). null-roomTypeId reviews are excluded
 * so they never join a per-room bucket (Pitfall 5).
 */
export async function getAllRoomTypeSummaries(): Promise<
  { name: string; average: number; count: number }[]
> {
  try {
    const grouped = await db.review.groupBy({
      by: ["roomTypeId"],
      where: { status: "APPROVED", roomTypeId: { not: null } },
      _avg: { rating: true },
      _count: true,
    });

    const roomTypeIds = grouped
      .map((g) => g.roomTypeId)
      .filter((id): id is string => id != null);

    if (roomTypeIds.length === 0) return [];

    const roomTypes = await db.roomType.findMany({
      where: { id: { in: roomTypeIds } },
    });
    const nameById = new Map(roomTypes.map((rt) => [rt.id, rt.name]));

    return grouped
      .filter((g) => g._count >= 1 && g.roomTypeId != null)
      .map((g) => ({
        name: nameById.get(g.roomTypeId as string) ?? "",
        average: g._avg.rating == null ? 0 : Math.round(g._avg.rating * 10) / 10,
        count: g._count,
      }));
  } catch (error) {
    console.error("Failed to fetch room type summaries:", error);
    return [];
  }
}
