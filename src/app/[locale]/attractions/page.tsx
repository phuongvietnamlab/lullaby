import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Điểm Tham Quan Hạ Long" : "Ha Long Bay Attractions",
    description:
      locale === "vi"
        ? "Khám phá những điểm tham quan nổi tiếng tại vịnh Hạ Long - hang động, đảo, bãi biển và trải nghiệm du thuyền"
        : "Discover famous attractions in Ha Long Bay - caves, islands, beaches and cruise experiences",
  };
}

const attractions = [
  {
    id: "sung-sot",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    titleKey: "attractions.sungSot.title",
    descKey: "attractions.sungSot.description",
  },
  {
    id: "ti-top",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    titleKey: "attractions.tiTop.title",
    descKey: "attractions.tiTop.description",
  },
  {
    id: "cruise",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    titleKey: "attractions.cruise.title",
    descKey: "attractions.cruise.description",
  },
  {
    id: "kayaking",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    titleKey: "attractions.kayaking.title",
    descKey: "attractions.kayaking.description",
  },
  {
    id: "fishing",
    image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80",
    titleKey: "attractions.fishing.title",
    descKey: "attractions.fishing.description",
  },
  {
    id: "sunset",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    titleKey: "attractions.sunset.title",
    descKey: "attractions.sunset.description",
  },
];

export default async function AttractionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AttractionsContent />;
}

function AttractionsContent() {
  const t = useTranslations();

  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1528127269322-539801943592?w=1400&q=80"
          alt="Ha Long Bay panoramic view"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl lg:text-7xl font-medium mb-4">
            {t("attractions.title")}
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            {t("attractions.subtitle")}
          </p>
          <div className="luxury-divider mx-auto mt-8" />
        </div>
      </section>

      {/* Intro */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <p className="text-lg text-[var(--color-text-light)] leading-relaxed">
              {t("attractions.intro")}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Attractions Grid */}
      <section className="pb-[var(--spacing-section)] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-24">
            {attractions.map((attraction, index) => (
              <ScrollReveal key={attraction.id} delay={0.1}>
                <article className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                  <div className={`relative aspect-[4/3] overflow-hidden rounded-sm ${index % 2 === 1 ? "md:order-2" : ""}`}>
                    <Image
                      src={attraction.image}
                      alt={t(attraction.titleKey as never)}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className={`space-y-4 ${index % 2 === 1 ? "md:order-1" : ""}`}>
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl">
                      {t(attraction.titleKey as never)}
                    </h2>
                    <div className="luxury-divider" />
                    <p className="text-[var(--color-text-light)] leading-relaxed text-lg">
                      {t(attraction.descKey as never)}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-[var(--spacing-section)] px-4 bg-[var(--color-primary)]">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl text-white mb-4">
              {t("attractions.cta.title")}
            </h2>
            <p className="text-white/70 mb-8">
              {t("attractions.cta.subtitle")}
            </p>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
