import { NextRequest, NextResponse } from "next/server";
import {
  validatePromoSchema,
  validatePromoCode,
  validateDates,
  calculateStayPrice,
  getBasePrice,
} from "@/lib/booking";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 30 code attempts per IP per hour (blocks code guessing)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = rateLimit(`promo:${ip}`, 30, 60 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = validatePromoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { code, roomSlug, checkIn, checkOut } = parsed.data;

    const dateValidation = validateDates(checkIn, checkOut);
    if (!dateValidation.valid) {
      return NextResponse.json({ error: dateValidation.error }, { status: 400 });
    }

    // Recompute the subtotal server-side - never trust a client-sent total
    const basePrice = await getBasePrice(roomSlug);
    const pricing = calculateStayPrice(basePrice, new Date(checkIn), new Date(checkOut));

    const result = await validatePromoCode(code, roomSlug, checkIn, pricing.total);

    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      name: result.name,
      discountType: result.discountType,
      discountValue: result.discountValue,
      discountAmount: result.discountAmount,
      subtotal: pricing.total,
      total: result.total,
    });
  } catch (error) {
    console.error("Validate promo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
