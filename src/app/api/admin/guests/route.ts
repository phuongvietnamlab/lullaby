import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/** Bookings that represent a stay the guest actually paid for. */
const COMPLETED_STATUSES = ["CHECK_OUT", "COMPLETED"] as const;
/** Bookings that count as a real (non-cancelled) reservation. */
const ACTIVE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECK_IN",
  "CHECK_OUT",
  "COMPLETED",
] as const;

export type VipLevel = "regular" | "silver" | "gold" | "platinum";

/**
 * Loyalty tier derived from lifetime spend. The schema stores no vipLevel
 * column, so this is computed rather than read — keep the thresholds here so
 * the badge and any future logic agree.
 */
function vipLevelFor(totalSpent: number): VipLevel {
  if (totalSpent >= 50_000_000) return "platinum";
  if (totalSpent >= 30_000_000) return "gold";
  if (totalSpent >= 10_000_000) return "silver";
  return "regular";
}

export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    const guests = await db.guest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        bookings: {
          select: {
            status: true,
            totalPrice: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    const formatted = guests.map((guest) => {
      const completed = guest.bookings.filter((b) =>
        (COMPLETED_STATUSES as readonly string[]).includes(b.status)
      );
      const active = guest.bookings.filter((b) =>
        (ACTIVE_STATUSES as readonly string[]).includes(b.status)
      );

      const totalSpent = completed.reduce(
        (sum, b) => sum + Number(b.totalPrice),
        0
      );

      // Most recent completed stay; falls back to null for a guest who has
      // booked but not yet stayed.
      const lastVisit = completed.reduce<Date | null>((latest, b) => {
        return !latest || b.checkOut > latest ? b.checkOut : latest;
      }, null);

      const upcoming = active.filter(
        (b) => !(COMPLETED_STATUSES as readonly string[]).includes(b.status)
      ).length;

      return {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone || "",
        nationality: guest.nationality || "",
        notes: guest.notes || "",
        totalBookings: active.length,
        totalStays: completed.length,
        upcomingStays: upcoming,
        totalSpent,
        lastVisit: lastVisit ? lastVisit.toISOString().split("T")[0] : null,
        vipLevel: vipLevelFor(totalSpent),
        createdAt: guest.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ guests: formatted });
  } catch (error) {
    console.error("Admin guests fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch guests" },
      { status: 500 }
    );
  }
}
