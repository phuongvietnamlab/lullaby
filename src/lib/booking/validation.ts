import { z } from "zod/v4";

export const checkAvailabilitySchema = z.object({
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guestCount: z.number().int().min(1).max(10),
  // When present, only this room type is searched (guest came from a room page)
  roomSlug: z.string().min(1).max(100).optional(),
});

export const createBookingSchema = z.object({
  roomTypeId: z.string().min(1),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guestCount: z.number().int().min(1).max(10),
  guestName: z.string().min(2).max(100),
  guestEmail: z.email(),
  guestPhone: z.string().min(8).max(20),
  specialRequests: z.string().max(500).optional().default(""),
  promoCode: z.string().max(50).optional(),
});

export const validatePromoSchema = z.object({
  code: z.string().min(1).max(50),
  roomSlug: z.string().min(1).max(100),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ValidatePromoInput = z.infer<typeof validatePromoSchema>;

/**
 * Validate that check-in is before check-out and both are in the future
 */
export function validateDates(checkIn: string, checkOut: string): { valid: boolean; error?: string } {
  // `new Date("2026-08-06")` is parsed as UTC midnight, so `today` has to be
  // built in UTC too. Mixing it with a local midnight rejects today's date on
  // any server west of UTC.
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkInDate < today) {
    return { valid: false, error: "Check-in date must be today or later" };
  }

  if (checkOutDate <= checkInDate) {
    return { valid: false, error: "Check-out must be after check-in" };
  }

  // Maximum stay: 30 nights
  const diffDays = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    return { valid: false, error: "Maximum stay is 30 nights" };
  }

  return { valid: true };
}
