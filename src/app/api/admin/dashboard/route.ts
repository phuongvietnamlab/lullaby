import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

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
      // Bookings today: count of bookings where checkIn is today
      db.booking.count({
        where: {
          checkIn: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Check-ins today: status = CHECK_IN and checkIn is today
      db.booking.count({
        where: {
          status: "CHECK_IN",
          checkIn: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Check-outs today: status = CHECK_OUT and checkOut is today
      db.booking.count({
        where: {
          status: "CHECK_OUT",
          checkOut: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Total rooms
      db.room.count(),

      // Occupied rooms: rooms with active CHECK_IN status booking for today
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

      // Revenue today: sum of totalPrice for bookings created today
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      }),

      // Revenue this month
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: {
            gte: monthStart,
            lt: todayEnd,
          },
        },
      }),

      // Revenue last month
      db.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: {
            gte: lastMonthStart,
            lt: lastMonthEnd,
          },
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
