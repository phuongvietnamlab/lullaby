import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getRoomBySlug, getAllRoomSlugs, formatPrice, rooms, getRoomI18nKey } from "@/lib/data/rooms";
import { getRoomTypeBySlugFromDB, getRoomTypesFromDB, type RoomTypeFromDB } from "@/lib/data/rooms-db";
import { RoomJsonLd } from "@/components/seo/json-ld";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  // Try to get slugs from DB first, fall back to static
  const dbRooms = await getRoomTypesFromDB();
  if (dbRooms.length > 0) {
    return dbRooms.map((room) => ({ slug: room.slug }));
  }
  const slugs = getAllRoomSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;

  // Try DB first
  const dbRoom = await getRoomTypeBySlugFromDB(slug);
  if (dbRoom) {
    const name = locale === "vi" ? dbRoom.name : dbRoom.nameEn;
    return {
      title: name,
      description:
        locale === "vi"
          ? `${name} - ${dbRoom.size || ""}m², tối đa ${dbRoom.maxGuests} khách, tầm nhìn tuyệt đẹp tại Lullaby Sky Villa`
          : `${name} - ${dbRoom.size || ""}m², up to ${dbRoom.maxGuests} guests, stunning views at Lullaby Sky Villa`,
      openGraph: {
        title: `${name} | Lullaby Sky Villa`,
        images: dbRoom.images.length > 0 ? dbRoom.images : undefined,
      },
    };
  }

  // Fallback to static data
  const room = getRoomBySlug(slug);
  if (!room) return {};

  const nameMap: Record<string, Record<string, string>> = {
    superior: { vi: "Phòng Superior Hướng Biển", en: "Superior Sea View Room" },
    deluxe: { vi: "Phòng Deluxe Hướng Vịnh", en: "Deluxe Bay View Room" },
    premium: { vi: "Suite Premium Hướng Đại Dương", en: "Premium Ocean Suite" },
    suite: { vi: "Suite Executive", en: "Executive Suite" },
    presidential: { vi: "Suite Tổng Thống", en: "Presidential Suite" },
  };
  const key = getRoomI18nKey(slug);
  const name = nameMap[key]?.[locale] || room.slug;

  return {
    title: name,
    description:
      locale === "vi"
        ? `${name} - ${room.size}m², tối đa ${room.maxGuests} khách, tầm nhìn tuyệt đẹp tại Lullaby Sky Villa`
        : `${name} - ${room.size}m², up to ${room.maxGuests} guests, stunning views at Lullaby Sky Villa`,
    openGraph: {
      title: `${name} | Lullaby Sky Villa`,
      images: room.images.map((img) => img.src),
    },
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Try DB first
  const dbRoom = await getRoomTypeBySlugFromDB(slug);

  // Fall back to static data if not in DB
  if (!dbRoom) {
    const room = getRoomBySlug(slug);
    if (!room) notFound();
  }

  return <RoomDetailContent locale={locale} slug={slug} dbRoom={dbRoom} />;
}

function RoomDetailContent({ locale, slug, dbRoom }: { locale: string; slug: string; dbRoom: RoomTypeFromDB | null }) {
  const t = useTranslations("rooms");
  const tRoomTypes = useTranslations("roomTypes");
  const tRoomDetail = useTranslations("roomDetail");
  const tCommon = useTranslations("common");

  const room = getRoomBySlug(slug);
  const key = getRoomI18nKey(slug);

  // Determine display values: prefer DB, fall back to i18n/static
  const roomName = dbRoom
    ? (locale === "vi" ? dbRoom.name : dbRoom.nameEn)
    : tRoomTypes(`${key}.name` as never);
  const roomDesc = dbRoom
    ? (locale === "vi" ? (dbRoom.description || tRoomTypes(`${key}.description` as never)) : (dbRoom.descriptionEn || tRoomTypes(`${key}.description` as never)))
    : tRoomTypes(`${key}.description` as never);

  const price = dbRoom?.basePrice || room?.price || 0;
  const size = dbRoom?.size || room?.size || 0;
  const maxGuests = dbRoom?.maxGuests || room?.maxGuests || 2;
  const bedType = dbRoom?.bedType || room?.bedType || "king";
  const amenities = dbRoom?.amenities.length ? dbRoom.amenities : (room?.amenities || []);
  const highlights = room?.highlights || [];
  const floor = room?.floor || "";
  const view = room?.view || "";

  // Images: prefer DB images, fall back to static
  const dbImages = dbRoom?.images.length ? dbRoom.images : [];
  const staticImages = room?.images || [];
  const heroImage = dbImages[0] || staticImages[0]?.src || "";
  const galleryImages = dbImages.length > 1
    ? dbImages.slice(1)
    : staticImages.slice(1).map(img => img.src);

  // Get other rooms for comparison
  const otherRooms = rooms.filter((r) => r.slug !== slug).slice(0, 2);

  return (
    <>
      <RoomJsonLd room={room || rooms[0]} locale={locale} roomName={roomName} roomDescription={roomDesc} />

      {/* Hero Gallery */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage}
            alt={roomName}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl text-white mb-3">
              {roomName}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/80 text-sm">
              {size > 0 && <span>{size} m²</span>}
              <span>•</span>
              <span>{t("maxGuests", { count: maxGuests })}</span>
              {view && (
                <>
                  <span>•</span>
                  <span>{tRoomDetail(`views.${view}` as never)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Room Content */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-12">
              <ScrollReveal>
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-2xl mb-4">
                    {tRoomDetail("overview")}
                  </h2>
                  <p className="text-[var(--color-text-light)] leading-relaxed text-lg">
                    {roomDesc}
                  </p>
                </div>
              </ScrollReveal>

              {/* Image gallery grid */}
              {galleryImages.length > 0 && (
                <ScrollReveal delay={0.1}>
                  <div className="grid grid-cols-2 gap-4">
                    {galleryImages.map((img, idx) => {
                      const imgSrc = typeof img === "string" ? img : img;
                      return (
                        <div key={idx} className="relative aspect-[4/3] overflow-hidden rounded-sm">
                          <Image
                            src={imgSrc}
                            alt={`${roomName} ${idx + 2}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            className="object-cover hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      );
                    })}
                  </div>
                </ScrollReveal>
              )}

              {/* Amenities */}
              <ScrollReveal delay={0.2}>
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-2xl mb-6">
                    {t("amenities")}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 p-3 rounded-sm border border-[var(--color-border)]"
                      >
                        <svg
                          className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span className="text-sm">
                          {tRoomDetail(`amenities.${amenity}` as never)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>

              {/* Highlights */}
              {highlights.length > 0 && (
                <ScrollReveal delay={0.3}>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl mb-6">
                      {tRoomDetail("highlights")}
                    </h2>
                    <ul className="space-y-3">
                      {highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-3">
                          <svg
                            className="w-5 h-5 text-[var(--color-accent)] mt-0.5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          <span className="text-[var(--color-text-light)]">
                            {tRoomDetail(`highlightsList.${highlight}` as never)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              )}
            </div>

            {/* Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 p-8 border border-[var(--color-border)] rounded-sm bg-white shadow-[var(--shadow-soft)]">
                <div className="text-center mb-6">
                  <span className="text-xs uppercase tracking-widest text-[var(--color-text-light)]">
                    {tCommon("from")}
                  </span>
                  <p className="text-3xl font-[family-name:var(--font-heading)] mt-1">
                    {formatPrice(price, locale)}
                  </p>
                  <span className="text-sm text-[var(--color-text-light)]">
                    {tCommon("perNight")}
                  </span>
                </div>

                <div className="luxury-divider mx-auto mb-6" />

                <div className="space-y-3 text-sm text-[var(--color-text-light)] mb-8">
                  {size > 0 && (
                    <div className="flex justify-between">
                      <span>{tRoomDetail("roomSize")}</span>
                      <span className="text-[var(--color-text)]">{size} m²</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{tRoomDetail("maxOccupancy")}</span>
                    <span className="text-[var(--color-text)]">{maxGuests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tRoomDetail("bedTypeLabel")}</span>
                    <span className="text-[var(--color-text)]">{tRoomDetail(`beds.${bedType}` as never)}</span>
                  </div>
                  {view && (
                    <div className="flex justify-between">
                      <span>{tRoomDetail("viewLabel")}</span>
                      <span className="text-[var(--color-text)]">{tRoomDetail(`views.${view}` as never)}</span>
                    </div>
                  )}
                  {floor && (
                    <div className="flex justify-between">
                      <span>{tRoomDetail("floorLabel")}</span>
                      <span className="text-[var(--color-text)]">{floor}</span>
                    </div>
                  )}
                </div>

                <Link
                  href="/booking"
                  className="block w-full text-center px-6 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)]"
                >
                  {tCommon("bookNow")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Rooms */}
      <section className="py-[var(--spacing-section)] px-4 bg-[var(--color-surface-dim)]">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl text-center mb-12">
              {tRoomDetail("otherRooms")}
            </h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            {otherRooms.map((otherRoom, idx) => {
              const otherKey = getRoomI18nKey(otherRoom.slug);
              return (
                <ScrollReveal key={otherRoom.id} delay={idx * 0.1}>
                  <Link
                    href={{ pathname: "/rooms/[slug]", params: { slug: otherRoom.slug } }}
                    className="group block overflow-hidden rounded-sm border border-[var(--color-border)] bg-white"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={otherRoom.images[0].src}
                        alt={otherRoom.images[0].alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        placeholder="blur"
                        blurDataURL={otherRoom.images[0].blurDataURL}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-[family-name:var(--font-heading)] text-xl mb-2">
                        {tRoomTypes(`${otherKey}.name` as never)}
                      </h3>
                      <p className="text-sm text-[var(--color-text-light)] mb-3">
                        {otherRoom.size} m² • {t("maxGuests", { count: otherRoom.maxGuests })}
                      </p>
                      <p className="font-[family-name:var(--font-heading)] text-lg">
                        {formatPrice(otherRoom.price, locale)}
                        <span className="text-sm text-[var(--color-text-light)] font-[family-name:var(--font-body)]">
                          {tCommon("perNight")}
                        </span>
                      </p>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
