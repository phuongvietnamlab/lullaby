import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { rooms, formatPrice, getRoomI18nKey } from "@/lib/data/rooms";
import { getRoomTypesFromDB, type RoomTypeFromDB } from "@/lib/data/rooms-db";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { LodgingBusinessJsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Phòng & Suite" : "Rooms & Suites",
    description:
      locale === "vi"
        ? "Khám phá các loại phòng sang trọng tại Lullaby Sky Villa - từ Superior đến Presidential Suite với tầm nhìn vịnh Hạ Long"
        : "Discover luxury room types at Lullaby Sky Villa - from Superior to Presidential Suite with Ha Long Bay views",
    openGraph: {
      title: locale === "vi" ? "Phòng & Suite | Lullaby Sky Villa" : "Rooms & Suites | Lullaby Sky Villa",
      description:
        locale === "vi"
          ? "Phòng nghỉ sang trọng với tầm nhìn vịnh Hạ Long"
          : "Luxury rooms with Ha Long Bay views",
      images: [rooms[0].images[0].src],
    },
  };
}

export default async function RoomsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch rooms from DB (falls back to mock data internally if DB is empty/fails)
  const dbRooms = await getRoomTypesFromDB();

  return (
    <>
      <LodgingBusinessJsonLd locale={locale} />
      <RoomsContent locale={locale} dbRooms={dbRooms} />
    </>
  );
}

function RoomsContent({ locale, dbRooms }: { locale: string; dbRooms: RoomTypeFromDB[] }) {
  const t = useTranslations("rooms");
  const tRoomTypes = useTranslations("roomTypes");
  const tCommon = useTranslations("common");

  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl lg:text-7xl font-medium mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="luxury-divider mx-auto mt-8" />
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-24">
            {dbRooms.map((room, index) => {
              // Display name: use DB name based on locale, fall back to i18n
              const roomName = locale === "vi" ? room.name : room.nameEn;
              const roomDesc = locale === "vi" ? room.description : room.descriptionEn;
              const i18nKey = getRoomI18nKey(room.slug);
              // Use DB description if available, otherwise fall back to i18n shortDesc
              const displayName = roomName || tRoomTypes(`${i18nKey}.name` as never);
              const displayDesc = roomDesc || tRoomTypes(`${i18nKey}.shortDesc` as never);
              const imageUrl = room.images[0] || rooms.find(r => r.slug === room.slug)?.images[0]?.src || "";

              return (
                <ScrollReveal key={room.id} delay={index * 0.1}>
                  <article className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Image */}
                    <div className={`relative aspect-[4/3] overflow-hidden rounded-sm ${index % 2 === 1 ? "md:order-2" : ""}`}>
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={displayName}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className={`space-y-6 ${index % 2 === 1 ? "md:order-1" : ""}`}>
                      <div>
                        <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl mb-3">
                          {displayName}
                        </h2>
                        <p className="text-[var(--color-text-light)] leading-relaxed">
                          {displayDesc}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-light)]">
                        {room.size && (
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                            </svg>
                            {room.size} m²
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                          </svg>
                          {t("maxGuests", { count: room.maxGuests })}
                        </span>
                      </div>

                      <div className="luxury-divider" />

                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-xs uppercase tracking-widest text-[var(--color-text-light)]">
                            {tCommon("from")}
                          </span>
                          <p className="text-2xl font-[family-name:var(--font-heading)]">
                            {formatPrice(room.basePrice, locale)}
                            <span className="text-sm text-[var(--color-text-light)] font-[family-name:var(--font-body)]">
                              {tCommon("perNight")}
                            </span>
                          </p>
                        </div>
                        <Link
                          href={{ pathname: "/rooms/[slug]", params: { slug: room.slug } }}
                          className="inline-flex items-center px-6 py-3 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-white transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)]"
                        >
                          {t("viewDetails")}
                        </Link>
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
