export type RoomAmenity = {
  icon: string;
  labelKey: string;
};

export type RoomImage = {
  src: string;
  alt: string;
  blurDataURL?: string;
};

export type RoomType = {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  shortDescKey: string;
  price: number;
  currency: string;
  size: number;
  maxGuests: number;
  bedType: string;
  view: string;
  floor: string;
  images: RoomImage[];
  amenities: string[];
  highlights: string[];
  featured: boolean;
};

// Placeholder blur data URL (tiny gradient)
const BLUR_PLACEHOLDER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGBkaGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5vX2teleA8CkKyMzNJkj+o+pSlAVapKz//Z";

// Unsplash image URLs for room types (free to use)
const ROOM_IMAGES = {
  superior: [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d955bc03e?w=800&q=80",
    "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
  ],
  deluxe: [
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
  ],
  premium: [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  ],
  suite: [
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80",
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80",
  ],
  presidential: [
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80",
  ],
};

export const rooms: RoomType[] = [
  {
    id: "1",
    slug: "superior-sea-view",
    nameKey: "roomTypes.superior.name",
    descriptionKey: "roomTypes.superior.description",
    shortDescKey: "roomTypes.superior.shortDesc",
    price: 2200000,
    currency: "VND",
    size: 32,
    maxGuests: 2,
    bedType: "king",
    view: "sea",
    floor: "3-8",
    images: ROOM_IMAGES.superior.map((src) => ({
      src,
      alt: "Superior Sea View Room",
      blurDataURL: BLUR_PLACEHOLDER,
    })),
    amenities: [
      "wifi",
      "ac",
      "minibar",
      "safe",
      "tv",
      "hairdryer",
      "bathrobe",
      "slippers",
    ],
    highlights: ["seaView", "balcony", "rainShower"],
    featured: true,
  },
  {
    id: "2",
    slug: "deluxe-bay-view",
    nameKey: "roomTypes.deluxe.name",
    descriptionKey: "roomTypes.deluxe.description",
    shortDescKey: "roomTypes.deluxe.shortDesc",
    price: 3500000,
    currency: "VND",
    size: 42,
    maxGuests: 2,
    bedType: "king",
    view: "bay",
    floor: "5-12",
    images: ROOM_IMAGES.deluxe.map((src) => ({
      src,
      alt: "Deluxe Bay View Room",
      blurDataURL: BLUR_PLACEHOLDER,
    })),
    amenities: [
      "wifi",
      "ac",
      "minibar",
      "safe",
      "tv",
      "hairdryer",
      "bathrobe",
      "slippers",
      "coffee",
      "turndown",
    ],
    highlights: ["bayView", "balcony", "bathtub", "rainShower"],
    featured: true,
  },
  {
    id: "3",
    slug: "premium-ocean-suite",
    nameKey: "roomTypes.premium.name",
    descriptionKey: "roomTypes.premium.description",
    shortDescKey: "roomTypes.premium.shortDesc",
    price: 5000000,
    currency: "VND",
    size: 55,
    maxGuests: 3,
    bedType: "king",
    view: "ocean",
    floor: "8-15",
    images: ROOM_IMAGES.premium.map((src) => ({
      src,
      alt: "Premium Ocean Suite",
      blurDataURL: BLUR_PLACEHOLDER,
    })),
    amenities: [
      "wifi",
      "ac",
      "minibar",
      "safe",
      "tv",
      "hairdryer",
      "bathrobe",
      "slippers",
      "coffee",
      "turndown",
      "lounge",
      "breakfast",
    ],
    highlights: ["oceanView", "separateLiving", "bathtub", "rainShower", "butlerService"],
    featured: true,
  },
  {
    id: "4",
    slug: "executive-suite",
    nameKey: "roomTypes.suite.name",
    descriptionKey: "roomTypes.suite.description",
    shortDescKey: "roomTypes.suite.shortDesc",
    price: 7500000,
    currency: "VND",
    size: 72,
    maxGuests: 4,
    bedType: "king",
    view: "panoramic",
    floor: "12-18",
    images: ROOM_IMAGES.suite.map((src) => ({
      src,
      alt: "Executive Suite",
      blurDataURL: BLUR_PLACEHOLDER,
    })),
    amenities: [
      "wifi",
      "ac",
      "minibar",
      "safe",
      "tv",
      "hairdryer",
      "bathrobe",
      "slippers",
      "coffee",
      "turndown",
      "lounge",
      "breakfast",
      "spa",
      "transfer",
    ],
    highlights: [
      "panoramicView",
      "separateLiving",
      "diningArea",
      "bathtub",
      "rainShower",
      "butlerService",
    ],
    featured: false,
  },
  {
    id: "5",
    slug: "presidential-suite",
    nameKey: "roomTypes.presidential.name",
    descriptionKey: "roomTypes.presidential.description",
    shortDescKey: "roomTypes.presidential.shortDesc",
    price: 15000000,
    currency: "VND",
    size: 120,
    maxGuests: 4,
    bedType: "king",
    view: "panoramic",
    floor: "18-20",
    images: ROOM_IMAGES.presidential.map((src) => ({
      src,
      alt: "Presidential Suite",
      blurDataURL: BLUR_PLACEHOLDER,
    })),
    amenities: [
      "wifi",
      "ac",
      "minibar",
      "safe",
      "tv",
      "hairdryer",
      "bathrobe",
      "slippers",
      "coffee",
      "turndown",
      "lounge",
      "breakfast",
      "spa",
      "transfer",
      "kitchen",
      "jacuzzi",
    ],
    highlights: [
      "panoramicView",
      "privatePool",
      "separateLiving",
      "diningArea",
      "kitchen",
      "jacuzzi",
      "butlerService",
      "airportTransfer",
    ],
    featured: false,
  },
];

// Gallery images organized by category
export type GalleryCategory = "rooms" | "views" | "dining" | "spa" | "facilities";

export type GalleryImage = {
  src: string;
  alt: string;
  category: GalleryCategory;
  blurDataURL: string;
};

export const galleryImages: GalleryImage[] = [
  // Rooms
  { src: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", alt: "Luxury room interior", category: "rooms", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80", alt: "Deluxe room with view", category: "rooms", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80", alt: "Suite living area", category: "rooms", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", alt: "Presidential suite", category: "rooms", blurDataURL: BLUR_PLACEHOLDER },
  // Views
  { src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80", alt: "Ha Long Bay sunrise", category: "views", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80", alt: "Ha Long Bay boats", category: "views", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80", alt: "Ocean sunset view", category: "views", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", alt: "Mountain bay view", category: "views", blurDataURL: BLUR_PLACEHOLDER },
  // Dining
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80", alt: "Fine dining restaurant", category: "dining", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800&q=80", alt: "Breakfast buffet", category: "dining", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80", alt: "Restaurant terrace", category: "dining", blurDataURL: BLUR_PLACEHOLDER },
  // Spa
  { src: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80", alt: "Spa treatment room", category: "spa", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80", alt: "Relaxation pool", category: "spa", blurDataURL: BLUR_PLACEHOLDER },
  // Facilities
  { src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80", alt: "Hotel exterior", category: "facilities", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", alt: "Swimming pool", category: "facilities", blurDataURL: BLUR_PLACEHOLDER },
  { src: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", alt: "Hotel lobby", category: "facilities", blurDataURL: BLUR_PLACEHOLDER },
];

// Helper functions
export function getRoomBySlug(slug: string): RoomType | undefined {
  return rooms.find((room) => room.slug === slug);
}

export function getFeaturedRooms(): RoomType[] {
  return rooms.filter((room) => room.featured);
}

export function getAllRoomSlugs(): string[] {
  return rooms.map((room) => room.slug);
}

// Map room slugs to i18n keys
const SLUG_TO_I18N_KEY: Record<string, string> = {
  "superior-sea-view": "superior",
  "deluxe-bay-view": "deluxe",
  "premium-ocean-suite": "premium",
  "executive-suite": "suite",
  "presidential-suite": "presidential",
};

export function getRoomI18nKey(slug: string): string {
  return SLUG_TO_I18N_KEY[slug] || slug.split("-")[0];
}

export function formatPrice(price: number, locale: string): string {
  if (locale === "vi") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  }
  // Convert VND to USD approximately for English display
  const usdPrice = Math.round(price / 25000);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usdPrice);
}
