import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyVnpayReturn } from "@/lib/payment/vnpay";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const { isValid, responseCode, txnRef } = verifyVnpayReturn(query);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Determine locale from the booking or default to "vi"
    const locale = "vi";

    if (!isValid) {
      return NextResponse.redirect(
        `${appUrl}/${locale}/booking/payment?status=failed&code=${txnRef}&reason=invalid_hash`
      );
    }

    if (responseCode === "00") {
      // Payment successful - update booking status
      await db.booking.update({
        where: { bookingCode: txnRef },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      return NextResponse.redirect(
        `${appUrl}/${locale}/booking/payment?status=success&code=${txnRef}`
      );
    } else {
      // Payment failed or cancelled
      return NextResponse.redirect(
        `${appUrl}/${locale}/booking/payment?status=failed&code=${txnRef}&reason=${responseCode}`
      );
    }
  } catch (error) {
    console.error("VNPay return error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/vi/booking/payment?status=failed&reason=error`
    );
  }
}
