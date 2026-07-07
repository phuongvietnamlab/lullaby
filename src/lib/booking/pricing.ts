import { rooms, type RoomType } from "@/lib/data/rooms";

/**
 * Season multipliers for dynamic pricing
 * Peak season: Dec-Feb (Tet, New Year), Jun-Aug (Summer)
 * Shoulder: Mar-May, Sep-Nov
 */
const SEASON_MULTIPLIERS: Record<string, number> = {
  peak: 1.5,
  shoulder: 1.0,
  offPeak: 0.85,
};

/**
 * Day-of-week multipliers
 * Weekend (Fri, Sat) gets a premium
 */
const DAY_MULTIPLIERS: Record<number, number> = {
  0: 1.0, // Sunday
  1: 0.9, // Monday
  2: 0.9, // Tuesday
  3: 0.9, // Wednesday
  4: 1.0, // Thursday
  5: 1.2, // Friday
  6: 1.3, // Saturday
};

function getSeason(date: Date): "peak" | "shoulder" | "offPeak" {
  const month = date.getMonth(); // 0-indexed
  // Peak: Dec(11), Jan(0), Feb(1), Jun(5), Jul(6), Aug(7)
  if ([0, 1, 5, 6, 7, 11].includes(month)) return "peak";
  // Shoulder: Mar(2), Apr(3), May(4), Sep(8), Oct(9), Nov(10)
  if ([2, 3, 4, 8, 9, 10].includes(month)) return "shoulder";
  return "offPeak";
}

function getDayMultiplier(date: Date): number {
  return DAY_MULTIPLIERS[date.getDay()] || 1.0;
}

function getSeasonMultiplier(date: Date): number {
  const season = getSeason(date);
  return SEASON_MULTIPLIERS[season];
}

/**
 * Calculate the price for a single night
 */
export function calculateNightPrice(basePrice: number, date: Date): number {
  const seasonMult = getSeasonMultiplier(date);
  const dayMult = getDayMultiplier(date);
  return Math.round(basePrice * seasonMult * dayMult);
}

/**
 * Calculate total price for a stay
 */
export function calculateTotalPrice(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): { total: number; nights: number; breakdown: { date: string; price: number }[] } {
  const room = rooms.find((r) => r.id === roomId || r.slug === roomId);
  if (!room) throw new Error(`Room not found: ${roomId}`);

  const breakdown: { date: string; price: number }[] = [];
  let total = 0;
  const currentDate = new Date(checkIn);

  while (currentDate < checkOut) {
    const nightPrice = calculateNightPrice(room.price, currentDate);
    breakdown.push({
      date: currentDate.toISOString().split("T")[0],
      price: nightPrice,
    });
    total += nightPrice;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    total,
    nights: breakdown.length,
    breakdown,
  };
}

/**
 * Get the price range for a room type (min-max across seasons)
 */
export function getPriceRange(room: RoomType): { min: number; max: number } {
  const min = Math.round(room.price * SEASON_MULTIPLIERS.offPeak * 0.9);
  const max = Math.round(room.price * SEASON_MULTIPLIERS.peak * 1.3);
  return { min, max };
}
