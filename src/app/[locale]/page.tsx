import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getFeaturedRooms, formatPrice, getRoomI18nKey } from "@/lib/data/rooms";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { HotelJsonLd } from "@/components/seo/json-ld";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HotelJsonLd locale={locale} />
      <HomeContent locale={locale} />
    </>
  );
}

function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tRoomTypes = useTranslations("roomTypes");
  const tRooms = useTranslations("rooms");

  const featuredRooms = getFeaturedRooms();

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background placeholder */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)] via-[var(--color-primary)] to-[var(--color-primary-light)]" />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="font-[family-name:var(--font-heading)] text-5xl md:text-7xl lg:text-8xl font-medium mb-6 tracking-tight">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <Link
            href="/rooms"
            className="inline-flex items-center px-10 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-medium rounded-full hover:bg-[var(--color-accent-light)] hover:shadow-[var(--shadow-glow)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] text-sm uppercase tracking-widest"
          >
            {t("hero.cta")}
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl mb-4">
              {t("features.title")}
            </h2>
            <p className="text-[var(--color-text-light)] mb-16 text-lg">
              {t("features.subtitle")}
            </p>
            <div className="luxury-divider mx-auto mb-16" />
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12">
            <ScrollReveal delay={0}>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-[var(--color-border)] rounded-full">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl">
                  {t("features.location.title")}
                </h3>
                <p className="text-[var(--color-text-light)] leading-relaxed">
                  {t("features.location.description")}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-[var(--color-border)] rounded-full">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl">
                  {t("features.rooms.title")}
                </h3>
                <p className="text-[var(--color-text-light)] leading-relaxed">
                  {t("features.rooms.description")}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-[var(--color-border)] rounded-full">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl">
                  {t("features.service.title")}
                </h3>
                <p className="text-[var(--color-text-light)] leading-relaxed">
                  {t("features.service.description")}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Room Highlights Section */}
      <section className="py-[var(--spacing-section)] px-4 bg-[var(--color-surface-dim)]">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl mb-4">
                {t("rooms.title")}
              </h2>
              <p className="text-[var(--color-text-light)] text-lg">
                {t("rooms.subtitle")}
              </p>
              <div className="luxury-divider mx-auto mt-6" />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredRooms.map((room, idx) => {
              const key = getRoomI18nKey(room.slug);
              return (
                <ScrollReveal key={room.id} delay={idx * 0.15}>
                  <Link
                    href={{ pathname: "/rooms/[slug]", params: { slug: room.slug } }}
                    className="group block overflow-hidden rounded-2xl bg-white border border-[var(--color-border)] hover:shadow-[var(--shadow-medium)] transition-all duration-[var(--duration-slow)] hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={room.images[0].src}
                        alt={room.images[0].alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        placeholder="blur"
                        blurDataURL={room.images[0].blurDataURL}
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <h3 className="font-[family-name:var(--font-heading)] text-xl">
                        {tRoomTypes(`${key}.name` as never)}
                      </h3>
                      <p className="text-sm text-[var(--color-text-light)] line-clamp-2">
                        {tRoomTypes(`${key}.shortDesc` as never)}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <p className="font-[family-name:var(--font-heading)] text-lg">
                          {formatPrice(room.price, locale)}
                          <span className="text-sm text-[var(--color-text-light)] font-[family-name:var(--font-body)]">
                            {tCommon("perNight")}
                          </span>
                        </p>
                        <span className="text-xs uppercase tracking-widest text-[var(--color-accent)] group-hover:translate-x-1 transition-transform">
                          {tRooms("viewDetails")} →
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal delay={0.3}>
            <div className="text-center mt-12">
              <Link
                href="/rooms"
                className="inline-flex items-center px-8 py-4 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs uppercase tracking-widest rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)]"
              >
                {t("rooms.viewAll")}
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[var(--spacing-section)] px-4 bg-[var(--color-primary)]">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-5xl text-white mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-white/70 mb-10 text-lg">{t("cta.subtitle")}</p>
            <Link
              href="/booking"
              className="inline-flex items-center px-10 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-medium rounded-full hover:bg-[var(--color-accent-light)] hover:shadow-[var(--shadow-glow)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] text-sm uppercase tracking-widest"
            >
              {t("cta.button")}
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
