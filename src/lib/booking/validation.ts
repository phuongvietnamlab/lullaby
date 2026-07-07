import { z } from "zod/v4";

export const checkAvailabilitySchema = z.object({
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guestCount: z.number().int().min(1).max(10),
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
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Validate that check-in is before check-out and both are in the future
 */
export function validateDates(checkIn: string, checkOut: string): { valid: boolean; error?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
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
