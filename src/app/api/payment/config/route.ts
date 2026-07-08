import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const config = await db.siteConfig.findUnique({
      where: { key: "payment_online_enabled" },
    });

    const isEnabled = config?.value === true || config?.value === "true";

    return NextResponse.json({ enabled: isEnabled });
  } catch (error) {
    console.error("Get payment config error:", error);
    return NextResponse.json({ enabled: false });
  }
}
