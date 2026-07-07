import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getActivePromotions, formatDiscount } from "@/lib/data/promotions";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Ưu Đãi Đặc Biệt" : "Special Offers",
    description:
      locale === "vi"
        ? "Những ưu đãi hấp dẫn cho kỳ nghỉ khó quên tại HASANA Hotel"
        : "Exclusive deals for an unforgettable stay at HASANA Hotel",
  };
}

export default async function PromotionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PromotionsContent locale={locale} />;
}

function PromotionsContent({ locale }: { locale: string }) {
  const t = useTranslations("promotions");
  const promotions = getActivePromotions();

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-[var(--color-primary)]">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl text-white mb-4">
              {t("title")}
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
            <div className="luxury-divider mx-auto mt-6" />
          </ScrollReveal>
        </div>
      </section>

      {/* Promotions Grid */}
      <section className="py-[var(--spacing-section)] px-4">
        <div className="max-w-6xl mx-auto">
          {promotions.length === 0 ? (
            <p className="text-center text-[var(--color-text-light)]">
              {t("noPromotions")}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {promotions.map((promo, idx) => (
                <ScrollReveal key={promo.id} delay={idx * 0.1}>
                  <div className="relative overflow-hidden border border-[var(--color-border)] rounded-sm bg-white hover:shadow-[var(--shadow-medium)] transition-shadow duration-[var(--duration-slow)]">
                    {/* Discount Badge */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-sm font-bold rounded-sm">
                        {promo.discountType === "percentage"
                          ? t("discount", { value: promo.discountValue })
                          : t("discountFixed", {
                              value: formatDiscount(promo, locale),
                            })}
                      </div>
                    </div>

                    <div className="p-6 md:p-8">
                      {/* Title */}
                      <h2 className="font-[family-name:var(--font-heading)] text-2xl mb-3 pr-24">
                        {promo.name}
                      </h2>

                      {/* Validity */}
                      <p className="text-sm text-[var(--color-text-light)] mb-4">
                        {t("validUntil", {
                          date: new Date(promo.endDate).toLocaleDateString(
                            locale === "vi" ? "vi-VN" : "en-US",
                            { year: "numeric", month: "long", day: "numeric" }
                          ),
                        })}
                      </p>

                      {/* Promo Code */}
                      <div className="mb-4 p-3 bg-[var(--color-surface-dim)] border border-dashed border-[var(--color-border-hover)] rounded-sm inline-flex items-center gap-2">
                        <span className="text-xs uppercase tracking-widest text-[var(--color-text-light)]">
                          {t("useCode")}:
                        </span>
                        <span className="font-mono font-bold text-[var(--color-primary)] tracking-wider">
                          {promo.code}
                        </span>
                      </div>

                      {/* Applicable Rooms */}
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-widest text-[var(--color-text-light)] mb-2">
                          {t("applicableRooms")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {promo.applicableRooms.map((room) => (
                            <span
                              key={room}
                              className="px-3 py-1 text-xs bg-[var(--color-surface-dim)] border border-[var(--color-border)] rounded-sm"
                            >
                              {room}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Uses Left & CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                        <span className="text-xs text-[var(--color-text-light)]">
                          {t("usesLeft", { count: promo.usesLeft })}
                        </span>
                        <Link
                          href="/booking"
                          className="inline-flex items-center px-5 py-2.5 bg-[var(--color-primary)] text-white text-xs uppercase tracking-widest font-medium rounded-sm hover:bg-[var(--color-primary-light)] transition-colors"
                        >
                          {t("bookWithOffer")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
