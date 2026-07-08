import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { getAboutContent } from "@/lib/data/rooms-db";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

// ISR: revalidate every 5 minutes
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
};

// Type for about page DB content (JSON stored in site_config)
type AboutDBContent = {
  story?: {
    title?: string;
    titleEn?: string;
    p1?: string;
    p1En?: string;
    p2?: string;
    p2En?: string;
  };
  values?: {
    title?: string;
    titleEn?: string;
  };
} | null;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Giới Thiệu" : "About Us",
    description:
      locale === "vi"
        ? "Tìm hiểu về Lullaby Sky Villa - khách sạn sang trọng 5 sao tọa lạc tại vịnh Hạ Long, Quảng Ninh"
        : "Learn about Lullaby Sky Villa - a luxury 5-star hotel located in Ha Long Bay, Quang Ninh, Vietnam",
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch about content from DB (admin-editable)
  const dbContent = await getAboutContent() as AboutDBContent;

  return <AboutContent locale={locale} dbContent={dbContent} />;
}

function AboutContent({ locale, dbContent }: { locale: string; dbContent: AboutDBContent }) {
  const t = useTranslations("about");

  // Helper: use DB content if available, otherwise fall back to i18n
  const storyTitle = (locale === "vi" ? dbContent?.story?.title : dbContent?.story?.titleEn) || t("story.title");
  const storyP1 = (locale === "vi" ? dbContent?.story?.p1 : dbContent?.story?.p1En) || t("story.p1");
  const storyP2 = (locale === "vi" ? dbContent?.story?.p2 : dbContent?.story?.p2En) || t("story.p2");
  const valuesTitle = (locale === "vi" ? dbContent?.values?.title : dbContent?.values?.titleEn) || t("values.title");

  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&q=80"
          alt="Lullaby Sky Villa exterior"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
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

      {/* Story Section */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl">
                  {storyTitle}
                </h2>
                <div className="luxury-divider" />
                <p className="text-[var(--color-text-light)] leading-relaxed text-lg">
                  {storyP1}
                </p>
                <p className="text-[var(--color-text-light)] leading-relaxed">
                  {storyP2}
                </p>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
                <Image
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                  alt="Lullaby Sky Villa pool area"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="py-[var(--spacing-section)] px-4 bg-[var(--color-surface-dim)]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl md:text-4xl mb-4">
                {valuesTitle}
              </h2>
              <div className="luxury-divider mx-auto" />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12">
            <ScrollReveal delay={0}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-[var(--color-accent)] rounded-full">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl">{t("values.excellence.title")}</h3>
                <p className="text-[var(--color-text-light)] leading-relaxed">{t("values.excellence.description")}</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-[var(--color-accent)] rounded-full">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl">{t("values.hospitality.title")}</h3>
                <p className="text-[var(--color-text-light)] leading-relaxed">{t("values.hospitality.description")}</p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto flex items-center justify-center border border-[var(--color-accent)] rounded-full">
                  <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl">{t("values.sustainability.title")}</h3>
                <p className="text-[var(--color-text-light)] leading-relaxed">{t("values.sustainability.description")}</p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-[var(--spacing-section)] px-4 bg-[var(--color-primary)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "150+", labelKey: "stats.rooms" },
              { value: "5★", labelKey: "stats.rating" },
              { value: "24/7", labelKey: "stats.service" },
              { value: "2020", labelKey: "stats.established" },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.labelKey} delay={idx * 0.1}>
                <div className="text-center text-white">
                  <p className="text-4xl md:text-5xl font-[family-name:var(--font-heading)] text-[var(--color-accent)] mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm uppercase tracking-widest text-white/60">
                    {t(stat.labelKey as never)}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
