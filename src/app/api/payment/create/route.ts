import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createVnpayUrl, VnpayConfigError } from "@/lib/payment/vnpay";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 20 payment-URL requests per IP per hour — the route confirms whether a
    // booking code exists, so it must not be freely enumerable.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = rateLimit(`payment-create:${ip}`, 20, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { bookingCode } = body;

    if (!bookingCode || typeof bookingCode !== "string") {
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
    const paymentUrl = await createVnpayUrl({
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
    if (error instanceof VnpayConfigError) {
      console.error("VNPay not configured:", error.message);
      return NextResponse.json(
        { error: "Online payment is not available right now" },
        { status: 503 }
      );
    }
    console.error("Create payment URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
