import { type RoomType } from "@/lib/data/rooms";

/**
 * Live APPROVED aggregate shape fed from getAverageRating / getRoomTypeReviewSummary.
 * ratingValue/ratingCount here are the EXACT numbers the caller computed — no
 * re-averaging in this module (SEO-04 / Pitfall 2).
 */
type Agg = { average: number; count: number };

/**
 * Attach a schema.org AggregateRating to a schema object ONLY when there is at
 * least one APPROVED review (D-07). When !agg || agg.count < 1 the schema is
 * returned unchanged — the aggregateRating node is omitted ENTIRELY (never
 * ratingCount: 0, which is a Rich Results structural error / T-11-07).
 */
function withAggregate(
  schema: Record<string, unknown>,
  agg?: Agg | null
): Record<string, unknown> {
  if (!agg || agg.count < 1) return schema;
  return {
    ...schema,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: agg.average,
      ratingCount: agg.count,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

type HotelReview = {
  author: string;
  rating: number;
  datePublished: string;
  body?: string;
};

type HotelJsonLdProps = {
  locale: string;
  agg?: Agg | null;
  reviews?: HotelReview[];
};

export function HotelJsonLd({ locale, agg, reviews }: HotelJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "Lullaby Sky Villa",
    description:
      locale === "vi"
        ? "Khách sạn sang trọng tại Hạ Long với tầm nhìn hướng biển tuyệt đẹp"
        : "Luxury hotel in Ha Long Bay with stunning ocean views",
    url: "https://lullabyskyvillahahalong.com",
    telephone: "+84-203-xxx-xxxx",
    email: "info@lullabyskyvillahahalong.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ha Long",
      addressLocality: "Ha Long",
      addressRegion: "Quang Ninh",
      addressCountry: "VN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "20.9517",
      longitude: "107.0748",
    },
    starRating: {
      "@type": "Rating",
      ratingValue: "5",
    },
    priceRange: "$$$",
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
      { "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true },
      { "@type": "LocationFeatureSpecification", name: "Spa", value: true },
      { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
      { "@type": "LocationFeatureSpecification", name: "Room Service", value: true },
    ],
    image: [
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    ],
  };

  // Site-wide AggregateRating (SEO-01), omitted entirely when count < 1 (D-07).
  let finalSchema = withAggregate(schema, agg);

  // Homepage featured Review nodes. Author name is truncated (<100 chars) and the
  // free-text body is OMITTED by default to neutralize the HIGH XSS item (T-11-06,
  // research A5). All values reach the <script> only via JSON.stringify below, which
  // escapes quotes and the "<" in "</script>" — no string concatenation of JSON.
  if (reviews && reviews.length > 0) {
    finalSchema = {
      ...finalSchema,
      review: reviews.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.author.slice(0, 99) },
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        datePublished: r.datePublished,
      })),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(finalSchema) }}
    />
  );
}

type RoomJsonLdProps = {
  room: RoomType;
  locale: string;
  roomName: string;
  roomDescription: string;
  agg?: Agg | null;
};

export function RoomJsonLd({
  room,
  locale,
  roomName,
  roomDescription,
  agg,
}: RoomJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: roomName,
    description: roomDescription,
    url: `https://lullabyskyvillahahalong.com/${locale}/rooms/${room.slug}`,
    image: room.images.map((img) => img.src),
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: room.maxGuests,
    },
    floorSize: {
      "@type": "QuantitativeValue",
      value: room.size,
      unitCode: "MTK",
    },
    offers: {
      "@type": "Offer",
      price: locale === "vi" ? room.price : Math.round(room.price / 25000),
      priceCurrency: locale === "vi" ? "VND" : "USD",
      availability: "https://schema.org/InStock",
    },
    bed: {
      "@type": "BedDetails",
      typeOfBed: room.bedType,
    },
  };

  // Per-room AggregateRating (SEO-02), omitted entirely when count < 1 (D-07).
  // Aggregate-only per-room — no Review nodes here, keeping XSS surface minimal.
  const finalSchema = withAggregate(schema, agg);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(finalSchema) }}
    />
  );
}

export function LodgingBusinessJsonLd({ locale }: { locale: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Lullaby Sky Villa",
    description:
      locale === "vi"
        ? "Khách sạn sang trọng tại Hạ Long"
        : "Luxury hotel in Ha Long Bay",
    url: "https://lullabyskyvillahahalong.com",
    telephone: "+84-203-xxx-xxxx",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ha Long",
      addressLocality: "Ha Long",
      addressRegion: "Quang Ninh",
      addressCountry: "VN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "20.9517",
      longitude: "107.0748",
    },
    checkinTime: "14:00",
    checkoutTime: "12:00",
    numberOfRooms: 150,
    petsAllowed: false,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
