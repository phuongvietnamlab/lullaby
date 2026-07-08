import { db } from "@/lib/db";
import { rooms as mockRooms, type RoomType as MockRoomType } from "./rooms";

export type RoomTypeFromDB = {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  basePrice: number;
  maxGuests: number;
  bedType: string | null;
  size: number | null;
  images: string[];
  amenities: string[];
  isActive: boolean;
  sortOrder: number;
};

/**
 * Fetch all active room types from DB.
 * Falls back to mock data if DB query fails.
 */
export async function getRoomTypesFromDB(): Promise<RoomTypeFromDB[]> {
  try {
    const roomTypes = await db.roomType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    if (roomTypes.length === 0) {
      // DB is empty, fallback to mock
      return mockToDBFormat();
    }

    return roomTypes.map((rt) => ({
      id: rt.id,
      slug: rt.slug,
      name: rt.name,
      nameEn: rt.nameEn,
      description: rt.description,
      descriptionEn: rt.descriptionEn,
      basePrice: Number(rt.basePrice),
      maxGuests: rt.maxGuests,
      bedType: rt.bedType,
      size: rt.size,
      images: (rt.images as string[]) || [],
      amenities: (rt.amenities as string[]) || [],
      isActive: rt.isActive,
      sortOrder: rt.sortOrder,
    }));
  } catch (error) {
    console.error("Failed to fetch room types from DB, using mock:", error);
    return mockToDBFormat();
  }
}

/**
 * Fetch a single room type by slug from DB.
 */
export async function getRoomTypeBySlugFromDB(
  slug: string
): Promise<RoomTypeFromDB | null> {
  try {
    const rt = await db.roomType.findUnique({
      where: { slug },
    });

    if (!rt) return null;

    return {
      id: rt.id,
      slug: rt.slug,
      name: rt.name,
      nameEn: rt.nameEn,
      description: rt.description,
      descriptionEn: rt.descriptionEn,
      basePrice: Number(rt.basePrice),
      maxGuests: rt.maxGuests,
      bedType: rt.bedType,
      size: rt.size,
      images: (rt.images as string[]) || [],
      amenities: (rt.amenities as string[]) || [],
      isActive: rt.isActive,
      sortOrder: rt.sortOrder,
    };
  } catch (error) {
    console.error("Failed to fetch room type from DB:", error);
    return null;
  }
}

/**
 * Fetch homepage content from DB (site_config).
 */
export async function getHomepageContent() {
  try {
    const config = await db.siteConfig.findUnique({
      where: { key: "homepage" },
    });
    return config?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch about page content from DB (site_config).
 */
export async function getAboutContent() {
  try {
    const config = await db.siteConfig.findUnique({
      where: { key: "about" },
    });
    return config?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch gallery images from DB.
 */
export async function getGalleryFromDB(category?: string) {
  try {
    const where = category && category !== "all" ? { category } : {};
    const images = await db.galleryImage.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });
    return images;
  } catch {
    return [];
  }
}

// Convert mock data to the DB format for fallback
function mockToDBFormat(): RoomTypeFromDB[] {
  return mockRooms.map((room: MockRoomType) => ({
    id: room.id,
    slug: room.slug,
    name: room.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    nameEn: room.slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: null,
    descriptionEn: null,
    basePrice: room.price,
    maxGuests: room.maxGuests,
    bedType: room.bedType,
    size: room.size,
    images: room.images.map((img) => img.src),
    amenities: room.amenities,
    isActive: true,
    sortOrder: parseInt(room.id),
  }));
}
