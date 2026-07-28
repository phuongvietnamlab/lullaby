import { db } from "@/lib/db";
import { rooms, getRoomI18nKey, type RoomType } from "@/lib/data/rooms";

/**
 * Fallback room inventory, used only when the DB is unreachable or has no
 * physical rooms seeded yet.
 */
const FALLBACK_INVENTORY: Record<string, number> = {
  "1": 10, // Superior Sea View
  "2": 8, // Deluxe Bay View
  "3": 5, // Premium Ocean Suite
  "4": 3, // Executive Suite
  "5": 1, // Presidential Suite
};

/** Booking statuses that still hold a room for the requested dates. */
const BLOCKING_STATUSES = ["PENDING", "CONFIRMED", "CHECK_IN"] as const;

export type AvailabilityResult = {
  roomTypeId: string;
  slug: string;
  /** i18n key used by the public site, e.g. "roomTypes.superior.name" */
  nameKey: string;
  basePrice: number;
  maxGuests: number;
  size: number;
  images: { src: string; alt: string }[];
  amenities: string[];
  highlights: string[];
  available: number;
};

function staticRoomBySlug(slug: string): RoomType | undefined {
  return rooms.find((r) => r.slug === slug);
}

function toResultFromStatic(room: RoomType, available: number): AvailabilityResult {
  return {
    roomTypeId: room.id,
    slug: room.slug,
    nameKey: room.nameKey,
    basePrice: room.price,
    maxGuests: room.maxGuests,
    size: room.size,
    images: room.images.map((img) => ({ src: img.src, alt: img.alt })),
    amenities: room.amenities,
    highlights: room.highlights,
    available,
  };
}

/**
 * Availability across all room types for the requested dates.
 * Reads inventory and bookings from the DB; falls back to static data if the
 * DB is unavailable.
 *
 * @param roomSlug - when set, only this room type is returned
 */
export async function checkAvailability(
  checkIn: string,
  checkOut: string,
  guestCount: number,
  roomSlug?: string
): Promise<AvailabilityResult[]> {
  try {
    const roomTypes = await db.roomType.findMany({
      where: {
        isActive: true,
        maxGuests: { gte: guestCount },
        ...(roomSlug ? { slug: roomSlug } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        rooms: { where: { status: { not: "OUT_OF_ORDER" } }, select: { id: true } },
        bookings: {
          where: {
            status: { in: [...BLOCKING_STATUSES] },
            checkIn: { lt: new Date(checkOut) },
            checkOut: { gt: new Date(checkIn) },
          },
          select: { id: true },
        },
      },
    });

    if (roomTypes.length === 0) {
      // DB not seeded yet - fall back to static data.
      return staticAvailability(checkIn, checkOut, guestCount, roomSlug);
    }

    return roomTypes
      .map((rt) => {
        const staticRoom = staticRoomBySlug(rt.slug);
        const inventory =
          rt.rooms.length || FALLBACK_INVENTORY[staticRoom?.id ?? ""] || 0;
        const available = inventory - rt.bookings.length;

        const dbImages = ((rt.images as string[]) || []).map((src) => ({
          src,
          alt: rt.nameEn,
        }));
        const dbAmenities = (rt.amenities as string[]) || [];

        return {
          roomTypeId: rt.id,
          slug: rt.slug,
          nameKey: `roomTypes.${getRoomI18nKey(rt.slug)}.name`,
          basePrice: Number(rt.basePrice),
          maxGuests: rt.maxGuests,
          size: rt.size ?? staticRoom?.size ?? 0,
          images: dbImages.length
            ? dbImages
            : (staticRoom?.images.map((img) => ({ src: img.src, alt: img.alt })) ?? []),
          amenities: dbAmenities.length ? dbAmenities : (staticRoom?.amenities ?? []),
          highlights: staticRoom?.highlights ?? [],
          available,
        };
      })
      .filter((r) => r.available > 0);
  } catch (error) {
    console.error("Availability DB query failed, using static data:", error);
    return staticAvailability(checkIn, checkOut, guestCount, roomSlug);
  }
}

function staticAvailability(
  _checkIn: string,
  _checkOut: string,
  guestCount: number,
  roomSlug?: string
): AvailabilityResult[] {
  return rooms
    .filter((room) => room.maxGuests >= guestCount)
    .filter((room) => !roomSlug || room.slug === roomSlug)
    .map((room) => toResultFromStatic(room, FALLBACK_INVENTORY[room.id] || 0))
    .filter((r) => r.available > 0);
}

/**
 * Whether a specific room type still has inventory for the given dates.
 */
export async function isRoomTypeAvailable(
  roomSlug: string,
  checkIn: string,
  checkOut: string,
  guestCount = 1
): Promise<boolean> {
  const results = await checkAvailability(checkIn, checkOut, guestCount, roomSlug);
  return results.length > 0;
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
 * Mark pending bookings past their expiry as EXPIRED so their inventory is
 * released back into availability.
 */
export async function expirePendingBookings(): Promise<number> {
  try {
    const { count } = await db.booking.updateMany({
      where: { status: "PENDING", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED", cancelledAt: new Date() },
    });
    return count;
  } catch (error) {
    console.error("Failed to expire pending bookings:", error);
    return 0;
  }
}
