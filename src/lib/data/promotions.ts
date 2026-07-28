/**
 * Promotions data helpers
 * Provides active and scheduled promotions for public pages
 */

import { db } from "@/lib/db";
import { mockPromotions } from "@/lib/admin/mock-data";

export type PublicPromotion = {
  id: string;
  name: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  applicableRooms: string[];
  usesLeft: number;
};

/**
 * Get promotions to advertise on the public site.
 *
 * Reads from the DB so the codes shown here are the same ones the checkout
 * validator accepts. Falls back to the static list only when the DB is empty
 * or unreachable.
 */
export async function getActivePromotions(
  locale: string = "vi"
): Promise<PublicPromotion[]> {
  try {
    const promos = await db.promotion.findMany({
      where: { isActive: true, endDate: { gte: new Date() } },
      orderBy: { endDate: "asc" },
      include: { roomTypes: { include: { roomType: true } } },
    });

    if (promos.length > 0) {
      return promos.map((promo) => ({
        id: promo.id,
        name: (locale === "vi" ? promo.name : promo.nameEn) || promo.name,
        code: promo.code ?? "",
        discountType: promo.discountType === "PERCENTAGE" ? "percentage" : "fixed",
        discountValue: Number(promo.discountValue),
        startDate: promo.startDate.toISOString(),
        endDate: promo.endDate.toISOString(),
        applicableRooms: promo.roomTypes.map((rt) =>
          locale === "vi" ? rt.roomType.name : rt.roomType.nameEn
        ),
        // The schema tracks no usage cap, so nothing to count down
        usesLeft: 0,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch promotions from DB, using static data:", error);
  }

  return mockPromotions
    .filter((promo) => promo.status === "active" || promo.status === "scheduled")
    .map((promo) => ({
      id: promo.id,
      name: promo.name,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      applicableRooms: promo.applicableRooms,
      usesLeft: promo.maxUsage - promo.usageCount,
    }));
}

/**
 * Format discount display value
 */
export function formatDiscount(promo: PublicPromotion, locale: string): string {
  if (promo.discountType === "percentage") {
    return `${promo.discountValue}%`;
  }
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(promo.discountValue);
}
