import { db } from "@/lib/db";
import { mockPromotions } from "@/lib/admin/mock-data";
import { rooms } from "@/lib/data/rooms";

export type PromoValidationError =
  | "notFound"
  | "inactive"
  | "notStarted"
  | "expired"
  | "notApplicable";

export type PromoValidationResult =
  | {
      valid: true;
      code: string;
      name: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number;
      discountAmount: number;
      total: number;
    }
  | { valid: false; reason: PromoValidationError };

/** Discount amount, clamped so a booking can never go negative. */
function computeDiscount(
  subtotal: number,
  discountType: "PERCENTAGE" | "FIXED_AMOUNT",
  discountValue: number
): number {
  const raw =
    discountType === "PERCENTAGE"
      ? Math.round((subtotal * discountValue) / 100)
      : Math.round(discountValue);
  return Math.min(Math.max(raw, 0), subtotal);
}

/** Date-only comparison so a promo is usable on its start and end day. */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Validate a promo code against a room type, a stay date and a subtotal.
 *
 * Always run this on the server before persisting a booking - the client-side
 * preview is only a display.
 */
export async function validatePromoCode(
  code: string,
  roomSlug: string,
  checkIn: string,
  subtotal: number
): Promise<PromoValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, reason: "notFound" };

  const stayDate = startOfDay(new Date(checkIn));

  try {
    const promo = await db.promotion.findFirst({
      where: { code: normalized },
      include: { roomTypes: { include: { roomType: { select: { slug: true } } } } },
    });

    if (promo) {
      if (!promo.isActive) return { valid: false, reason: "inactive" };
      if (stayDate < startOfDay(promo.startDate))
        return { valid: false, reason: "notStarted" };
      if (stayDate > startOfDay(promo.endDate))
        return { valid: false, reason: "expired" };

      // No linked room types means the promo applies to every room type.
      const applicableSlugs = promo.roomTypes.map((rt) => rt.roomType.slug);
      if (applicableSlugs.length > 0 && !applicableSlugs.includes(roomSlug)) {
        return { valid: false, reason: "notApplicable" };
      }

      const discountAmount = computeDiscount(
        subtotal,
        promo.discountType,
        Number(promo.discountValue)
      );
      return {
        valid: true,
        code: normalized,
        name: promo.name,
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        discountAmount,
        total: subtotal - discountAmount,
      };
    }

    // The query succeeded and this code is not in the table. Falling through to
    // the static list here would keep honouring the built-in demo codes
    // (EARLY2025, WEEKEND30, ...) forever — a code an admin deleted, or never
    // created, would still take money off the booking. Only bootstrap from
    // static data while the table is genuinely empty.
    const promoCount = await db.promotion.count();
    if (promoCount > 0) {
      return { valid: false, reason: "notFound" };
    }
  } catch (error) {
    console.error("Promotion DB lookup failed, falling back to static data:", error);
  }

  return validateAgainstStaticPromotions(normalized, roomSlug, stayDate, subtotal);
}

/**
 * Fallback used while the promotions table is empty (or unreachable).
 * The static promo list stores applicable rooms by display name, so map those
 * back to slugs.
 */
function validateAgainstStaticPromotions(
  code: string,
  roomSlug: string,
  stayDate: Date,
  subtotal: number
): PromoValidationResult {
  const promo = mockPromotions.find((p) => p.code.toUpperCase() === code);
  if (!promo) return { valid: false, reason: "notFound" };
  if (promo.status === "expired") return { valid: false, reason: "expired" };
  if (stayDate < startOfDay(new Date(promo.startDate)))
    return { valid: false, reason: "notStarted" };
  if (stayDate > startOfDay(new Date(promo.endDate)))
    return { valid: false, reason: "expired" };
  if (promo.usageCount >= promo.maxUsage) return { valid: false, reason: "expired" };

  const appliesToAll = promo.applicableRooms.some(
    (name) => name.toLowerCase() === "all room types"
  );
  if (!appliesToAll) {
    const allowedSlugs = promo.applicableRooms
      .map((name) => displayNameToSlug(name))
      .filter((slug): slug is string => Boolean(slug));
    if (!allowedSlugs.includes(roomSlug)) {
      return { valid: false, reason: "notApplicable" };
    }
  }

  const discountType = promo.discountType === "percentage" ? "PERCENTAGE" : "FIXED_AMOUNT";
  const discountAmount = computeDiscount(subtotal, discountType, promo.discountValue);

  return {
    valid: true,
    code,
    name: promo.name,
    discountType,
    discountValue: promo.discountValue,
    discountAmount,
    total: subtotal - discountAmount,
  };
}

function displayNameToSlug(displayName: string): string | undefined {
  const normalized = displayName.trim().toLowerCase().replace(/\s+/g, "-");
  return rooms.find(
    (room) => room.slug === normalized || room.slug.startsWith(normalized)
  )?.slug;
}
