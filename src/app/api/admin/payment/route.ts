import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const configs = await db.siteConfig.findMany({
      where: { category: "payment" },
    });

    const settings: Record<string, unknown> = {};
    for (const config of configs) {
      settings[config.key] = config.value;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get payment settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_online_enabled, vnpay_tmn_code, vnpay_hash_secret } = body;

    // Update payment enabled toggle
    if (typeof payment_online_enabled === "boolean") {
      await db.siteConfig.upsert({
        where: { key: "payment_online_enabled" },
        update: { value: payment_online_enabled },
        create: {
          key: "payment_online_enabled",
          value: payment_online_enabled,
          category: "payment",
        },
      });
    }

    // Update VNPay TMN Code
    if (vnpay_tmn_code !== undefined) {
      await db.siteConfig.upsert({
        where: { key: "vnpay_tmn_code" },
        update: { value: vnpay_tmn_code },
        create: {
          key: "vnpay_tmn_code",
          value: vnpay_tmn_code,
          category: "payment",
        },
      });
    }

    // Update VNPay Hash Secret
    if (vnpay_hash_secret !== undefined) {
      await db.siteConfig.upsert({
        where: { key: "vnpay_hash_secret" },
        update: { value: vnpay_hash_secret },
        create: {
          key: "vnpay_hash_secret",
          value: vnpay_hash_secret,
          category: "payment",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update payment settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
