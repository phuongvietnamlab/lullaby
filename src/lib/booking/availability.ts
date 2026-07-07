import { rooms, type RoomType } from "@/lib/data/rooms";

/**
 * Mock room inventory - in production this would come from the database.
 * Each room type has a certain number of physical rooms available.
 */
const ROOM_INVENTORY: Record<string, number> = {
  "1": 10, // Superior Sea View: 10 rooms
  "2": 8,  // Deluxe Bay View: 8 rooms
  "3": 5,  // Premium Ocean Suite: 5 rooms
  "4": 3,  // Executive Suite: 3 rooms
  "5": 1,  // Presidential Suite: 1 room
};

// TODO: Replace with Prisma query in production
// In-memory bookings store for demo purposes
export type BookingRecord = {
  id: string;
  bookingCode: string;
  roomId: string;
  roomTypeId: string;
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  guestCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
};

// In-memory store (resets on server restart)
export const bookingsStore: BookingRecord[] = [];

/**
 * Check how many rooms of a given type are available for the specified dates
 */
export function checkAvailability(
  checkIn: string,
  checkOut: string,
  guestCount: number
): { roomId: string; room: RoomType; available: number }[] {
  const results: { roomId: string; room: RoomType; available: number }[] = [];

  for (const room of rooms) {
    // Skip rooms that can't accommodate the guest count
    if (room.maxGuests < guestCount) continue;

    const totalInventory = ROOM_INVENTORY[room.id] || 0;

    // Count active bookings that overlap with the requested dates
    const overlappingBookings = bookingsStore.filter((booking) => {
      if (booking.roomTypeId !== room.id) return false;
      if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return false;
      // Check date overlap
      return booking.checkIn < checkOut && booking.checkOut > checkIn;
    });

    const available = totalInventory - overlappingBookings.length;

    if (available > 0) {
      results.push({
        roomId: room.id,
        room,
        available,
      });
    }
  }

  return results;
}

/**
 * Check if a specific room type is available for the given dates
 */
export function isRoomTypeAvailable(
  roomTypeId: string,
  checkIn: string,
  checkOut: string
): boolean {
  const totalInventory = ROOM_INVENTORY[roomTypeId] || 0;
  
  const overlappingBookings = bookingsStore.filter((booking) => {
    if (booking.roomTypeId !== roomTypeId) return false;
    if (booking.status === "CANCELLED" || booking.status === "EXPIRED") return false;
    return booking.checkIn < checkOut && booking.checkOut > checkIn;
  });

  return totalInventory - overlappingBookings.length > 0;
}

/**
 * Generate a unique booking code: LULLABY-XXXXXX
 */
export function generateBookingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LULLABY-${code}`;
}

/**
 * Expire pending bookings older than 48 hours
 */
export function expirePendingBookings(): number {
  const now = new Date().toISOString();
  let expiredCount = 0;

  for (const booking of bookingsStore) {
    if (booking.status === "PENDING" && booking.expiresAt < now) {
      booking.status = "EXPIRED";
      expiredCount++;
    }
  }

  return expiredCount;
}
