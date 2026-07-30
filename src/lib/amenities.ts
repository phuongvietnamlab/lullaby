// Maps amenity display labels stored in the DB/mock data to i18n keys under
// `roomDetail.amenities`. Data historically stored human strings ("Smart TV")
// instead of keys, so this normalizer lets both forms localize.

const LABEL_TO_KEY: Record<string, string> = {
  wifi: "wifi",
  ac: "ac",
  minibar: "minibar",
  safe: "safe",
  tv: "tv",
  "smart tv": "tv",
  bathrobe: "bathrobe",
  "rain shower": "rainshower",
  "coffee machine": "coffee",
  coffee: "coffee",
  balcony: "balcony",
  "turndown service": "turndown",
  turndown: "turndown",
  "lounge access": "lounge",
  lounge: "lounge",
  "breakfast included": "breakfast",
  breakfast: "breakfast",
  "spa credit": "spa",
  spa: "spa",
  "airport transfer": "transfer",
  transfer: "transfer",
  "private pool": "pool",
  pool: "pool",
  kitchen: "kitchen",
  jacuzzi: "jacuzzi",
  "butler 24/7": "butler",
  butler: "butler",
  hairdryer: "hairdryer",
  slippers: "slippers",
};

/**
 * Resolve an amenity value to its i18n key, or null if unknown.
 * Accepts both display labels ("Smart TV") and raw keys ("tv").
 */
export function amenityKey(amenity: string): string | null {
  return LABEL_TO_KEY[amenity.trim().toLowerCase()] ?? null;
}
