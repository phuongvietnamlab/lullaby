import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/auth-utils";
import { expirePendingBookings } from "@/lib/booking";

export const dynamic = "force-dynamic";

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const ACTIVE_STAY_STATUSES = ["CONFIRMED", "CHECK_IN"] as const;
const CHECKOUT_STATUSES = ["CHECK_IN", "CHECK_OUT", "COMPLETED"] as const;
const REVENUE_STATUSES = ["CONFIRMED", "CHECK_IN", "CHECK_OUT", "COMPLETED"] as const;

function getVietnamDateRanges(now: Date) {
  const vietnamNow = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  const todayStart = new Date(
    Date.UTC(
      vietnamNow.getUTCFullYear(),
      vietnamNow.getUTCMonth(),
      vietnamNow.getUTCDate()
    ) - VIETNAM_OFFSET_MS
  );
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const monthStart = new Date(
    Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), 1) -
      VIETNAM_OFFSET_MS
  );
  const lastMonthStart = new Date(
    Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth() - 1, 1) -
      VIETNAM_OFFSET_MS
  );
  const lastMonthEnd = monthStart;

  return { todayStart, todayEnd, monthStart, lastMonthStart, lastMonthEnd };
}

export async function GET() {
  try {
    const guard = await requireAdminApi();
    if (guard instanceof NextResponse) return guard;

    await expirePendingBookings();

    const now = new Date();
    const { todayStart, todayEnd, monthStart, lastMonthStart, lastMonthEnd } =
      getVietnamDateRanges(now);

    // Run all queries in parallel for performance
    const [
      bookingsToday,
      checkInsToday,
      checkOutsToday,
      totalRooms,
      occupiedRooms,
      maintenanceRooms,
      revenueTodayResult,
      revenueThisMonthResult,
      revenueLastMonthResult,
      pendingBookings,
      pendingReviews,
      averageRatingResult,
      totalGuests,
      recentBookings,
    ] = await Promise.all([
      // Bookings today: new bookings created today in Vietnam time.
      db.booking.count({
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Check-ins today: active arrivals scheduled for today.
      db.booking.count({
        where: {
          status: { in: [...ACTIVE_STAY_STATUSES] },
          checkIn: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Check-outs today: stays that are due out or already checked out today.
      db.booking.count({
        where: {
          status: { in: [...CHECKOUT_STATUSES] },
          checkOut: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Total rooms
      db.room.count(),

      // Occupied rooms: guests currently checked in.
      db.booking.count({
        where: {
          status: "CHECK_IN",
          checkIn: { lte: now },
          checkOut: { gte: now },
        },
      }),

      // Maintenance rooms
      db.room.count({
        where: { status: "MAINTENANCE" },
      }),

      // Revenue today: confirmed revenue recognized today.
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: [...REVENUE_STATUSES] },
          OR: [
            { confirmedAt: { gte: todayStart, lt: todayEnd } },
            { confirmedAt: null, createdAt: { gte: todayStart, lt: todayEnd } },
          ],
        },
      }),

      // Revenue this month: confirmed revenue recognized in Vietnam month.
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: [...REVENUE_STATUSES] },
          OR: [
            { confirmedAt: { gte: monthStart, lt: todayEnd } },
            { confirmedAt: null, createdAt: { gte: monthStart, lt: todayEnd } },
          ],
        },
      }),

      // Revenue last month: confirmed revenue recognized in Vietnam month.
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          status: { in: [...REVENUE_STATUSES] },
          OR: [
            { confirmedAt: { gte: lastMonthStart, lt: lastMonthEnd } },
            { confirmedAt: null, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
          ],
        },
      }),

      // Pending bookings
      db.booking.count({
        where: { status: "PENDING" },
      }),

      // Pending reviews
      db.review.count({
        where: { status: "PENDING" },
      }),

      // Average rating from approved reviews
      db.review.aggregate({
        _avg: { rating: true },
        where: { status: "APPROVED" },
      }),

      // Total guests
      db.guest.count(),

      // Recent bookings: last 5 with guest name, room type, dates, status
      db.booking.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          bookingCode: true,
          checkIn: true,
          checkOut: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          guest: {
            select: { name: true },
          },
          roomType: {
            select: { name: true },
          },
        },
      }),
    ]);

    const availableRooms = totalRooms - occupiedRooms - maintenanceRooms;
    const occupancyRate = totalRooms > 0
      ? Math.round((occupiedRooms / totalRooms) * 100)
      : 0;

    const revenueToday = Number(revenueTodayResult._sum.totalPrice ?? 0);
    const revenueThisMonth = Number(revenueThisMonthResult._sum.totalPrice ?? 0);
    const revenueLastMonth = Number(revenueLastMonthResult._sum.totalPrice ?? 0);
    const averageRating = averageRatingResult._avg.rating
      ? Math.round(averageRatingResult._avg.rating * 10) / 10
      : 0;

    return NextResponse.json({
      bookingsToday,
      checkInsToday,
      checkOutsToday,
      occupancyRate,
      totalRooms,
      occupiedRooms,
      availableRooms: Math.max(0, availableRooms),
      maintenanceRooms,
      revenueToday,
      revenueThisMonth,
      revenueLastMonth,
      pendingBookings,
      pendingReviews,
      averageRating,
      totalGuests,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookingCode: b.bookingCode,
        guestName: b.guest.name,
        roomTypeName: b.roomType.name,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        status: b.status.toLowerCase(),
        totalPrice: Number(b.totalPrice),
        createdAt: b.createdAt.toISOString(),
      })),
      lastUpdated: now.toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
