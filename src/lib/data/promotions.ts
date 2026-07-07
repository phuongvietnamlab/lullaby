/**
 * Promotions data helpers
 * Provides active and scheduled promotions for public pages
 */

import { mockPromotions, type PromotionAdmin } from "@/lib/admin/mock-data";

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
 * Get all active promotions for public display
 */
export function getActivePromotions(): PublicPromotion[] {
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
