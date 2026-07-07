import { type RoomType } from "@/lib/data/rooms";

type HotelJsonLdProps = {
  locale: string;
};

export function HotelJsonLd({ locale }: HotelJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "HASANA Hotel",
    description:
      locale === "vi"
        ? "Khách sạn sang trọng tại Hạ Long với tầm nhìn hướng biển tuyệt đẹp"
        : "Luxury hotel in Ha Long Bay with stunning ocean views",
    url: "https://hasanahotel.com",
    telephone: "+84-203-xxx-xxxx",
    email: "info@hasanahotel.com",
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type RoomJsonLdProps = {
  room: RoomType;
  locale: string;
  roomName: string;
  roomDescription: string;
};

export function RoomJsonLd({ room, locale, roomName, roomDescription }: RoomJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: roomName,
    description: roomDescription,
    url: `https://hasanahotel.com/${locale}/rooms/${room.slug}`,
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LodgingBusinessJsonLd({ locale }: { locale: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "HASANA Hotel",
    description:
      locale === "vi"
        ? "Khách sạn sang trọng tại Hạ Long"
        : "Luxury hotel in Ha Long Bay",
    url: "https://hasanahotel.com",
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
