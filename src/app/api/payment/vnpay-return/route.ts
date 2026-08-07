import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyVnpayReturn } from "@/lib/payment/vnpay";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const locale = "vi";

  const fail = (code: string, reason: string) =>
    NextResponse.redirect(
      `${appUrl}/${locale}/booking/payment?status=failed&code=${encodeURIComponent(code)}&reason=${encodeURIComponent(reason)}`
    );

  try {
    const searchParams = request.nextUrl.searchParams;
    const query: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const { isValid, responseCode, txnRef, amount } =
      await verifyVnpayReturn(query);

    if (!isValid) {
      return fail(txnRef, "invalid_hash");
    }

    if (responseCode !== "00") {
      return fail(txnRef, responseCode);
    }

    const booking = await db.booking.findUnique({
      where: { bookingCode: txnRef },
    });

    if (!booking) {
      return fail(txnRef, "booking_not_found");
    }

    // The gateway echoes back the amount it actually charged. Confirming
    // without comparing it to the booking total would accept an underpayment.
    if (Math.round(amount) !== Math.round(Number(booking.totalPrice))) {
      console.error(
        `[VNPay] Amount mismatch for ${txnRef}: paid ${amount}, expected ${Number(booking.totalPrice)}`
      );
      return fail(txnRef, "amount_mismatch");
    }

    // Already confirmed — the return URL was replayed or refreshed. Treat it as
    // success but do not touch the record again.
    if (booking.status === "CONFIRMED") {
      return NextResponse.redirect(
        `${appUrl}/${locale}/booking/payment?status=success&code=${encodeURIComponent(txnRef)}`
      );
    }

    // Only a booking still awaiting payment may be confirmed by this callback.
    if (booking.status !== "PENDING") {
      return fail(txnRef, "booking_not_pending");
    }

    // Conditional update: if a concurrent callback already moved the row off
    // PENDING, this matches nothing instead of overwriting the newer state.
    const { count } = await db.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    if (count === 0) {
      return fail(txnRef, "booking_not_pending");
    }

    return NextResponse.redirect(
      `${appUrl}/${locale}/booking/payment?status=success&code=${encodeURIComponent(txnRef)}`
    );
  } catch (error) {
    console.error("VNPay return error:", error);
    return NextResponse.redirect(
      `${appUrl}/${locale}/booking/payment?status=failed&reason=error`
    );
  }
}
