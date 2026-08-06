import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isVnpayConfigured } from "@/lib/payment/vnpay";

export async function GET() {
  try {
    const config = await db.siteConfig.findUnique({
      where: { key: "payment_online_enabled" },
    });

    const toggledOn = config?.value === true || config?.value === "true";

    // Only advertise online payment when credentials actually exist, otherwise
    // the guest reaches a pay button that can only fail.
    const isEnabled = toggledOn && (await isVnpayConfigured());

    return NextResponse.json({ enabled: isEnabled });
  } catch (error) {
    console.error("Get payment config error:", error);
    return NextResponse.json({ enabled: false });
  }
}
