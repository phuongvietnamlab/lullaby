import { db } from "@/lib/db";
import { rooms, type RoomType } from "@/lib/data/rooms";

export type PriceBreakdown = {
  total: number;
  nights: number;
  breakdown: { date: string; price: number }[];
};

/**
 * Price for a single night.
 *
 * The quoted price must always equal the price advertised on the room list /
 * room detail pages, so this is a flat per-night rate. Seasonal or day-of-week
 * pricing must come from the `SeasonalPrice` table and be reflected in the
 * public listings too - never applied silently at booking time.
 */
export function calculateNightPrice(basePrice: number): number {
  return Math.round(basePrice);
}

/**
 * Build the per-night breakdown for a stay from a known base price.
 */
export function calculateStayPrice(
  basePrice: number,
  checkIn: Date,
  checkOut: Date
): PriceBreakdown {
  const breakdown: { date: string; price: number }[] = [];
  let total = 0;
  const currentDate = new Date(checkIn);

  while (currentDate < checkOut) {
    const nightPrice = calculateNightPrice(basePrice);
    breakdown.push({
      date: currentDate.toISOString().split("T")[0],
      price: nightPrice,
    });
    total += nightPrice;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { total, nights: breakdown.length, breakdown };
}

/**
 * Resolve the authoritative base price for a room type.
 * Prefers the DB value (admin-editable) and falls back to the static data.
 */
export async function getBasePrice(roomIdOrSlug: string): Promise<number> {
  try {
    const rt = await db.roomType.findFirst({
      where: { OR: [{ id: roomIdOrSlug }, { slug: roomIdOrSlug }] },
      select: { basePrice: true },
    });
    if (rt) return Number(rt.basePrice);
  } catch (error) {
    console.error("Failed to read base price from DB, using static data:", error);
  }

  const room = rooms.find((r) => r.id === roomIdOrSlug || r.slug === roomIdOrSlug);
  if (!room) throw new Error(`Room not found: ${roomIdOrSlug}`);
  return room.price;
}

/**
 * Calculate the total price for a stay, sourcing the base price from the DB.
 */
export async function calculateTotalPrice(
  roomIdOrSlug: string,
  checkIn: Date,
  checkOut: Date
): Promise<PriceBreakdown> {
  const basePrice = await getBasePrice(roomIdOrSlug);
  return calculateStayPrice(basePrice, checkIn, checkOut);
}

/**
 * Price range for a room type. Flat pricing, so min === max.
 */
export function getPriceRange(room: RoomType): { min: number; max: number } {
  return { min: room.price, max: room.price };
}
