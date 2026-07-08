import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createVnpayUrl } from "@/lib/payment/vnpay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingCode } = body;

    if (!bookingCode) {
      return NextResponse.json(
        { error: "Booking code is required" },
        { status: 400 }
      );
    }

    // Check if online payment is enabled
    const paymentConfig = await db.siteConfig.findUnique({
      where: { key: "payment_online_enabled" },
    });

    const isPaymentEnabled = paymentConfig?.value === true || paymentConfig?.value === "true";

    if (!isPaymentEnabled) {
      return NextResponse.json(
        { error: "Online payment is not enabled" },
        { status: 403 }
      );
    }

    // Find the booking
    const booking = await db.booking.findUnique({
      where: { bookingCode },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Booking is not in pending status" },
        { status: 400 }
      );
    }

    // Get client IP
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded?.split(",")[0]?.trim() || "127.0.0.1";

    // Create VNPay URL
    const paymentUrl = createVnpayUrl({
      amount: Number(booking.totalPrice),
      orderId: booking.bookingCode,
      orderInfo: `Thanh toan don dat phong ${booking.bookingCode}`,
      ipAddress,
      locale: "vn",
    });

    return NextResponse.json({
      success: true,
      paymentUrl,
    });
  } catch (error) {
    console.error("Create payment URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
