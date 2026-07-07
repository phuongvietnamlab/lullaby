import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getApprovedReviews, getAverageRating } from "@/lib/data/reviews";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "vi" ? "Đánh Giá Từ Khách" : "Guest Reviews",
    description:
      locale === "vi"
        ? "Khách hàng nói gì về kỳ nghỉ tại Lullaby Sky Villa"
        : "What our guests say about their stay at Lullaby Sky Villa",
  };
}

export default async function ReviewsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ReviewsContent locale={locale} />;
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${
            star <= rating ? "text-[var(--color-accent)]" : "text-[var(--color-border)]"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewsContent({ locale }: { locale: string }) {
  const t = useTranslations("reviews");
  const reviews = getApprovedReviews();
  const { average, count } = getAverageRating();

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 bg-[var(--color-surface-dim)]">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-6xl mb-4">
              {t("title")}
            </h1>
            <p className="text-[var(--color-text-light)] text-lg max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
            <div className="luxury-divider mx-auto mt-6" />
          </ScrollReveal>
        </div>
      </section>

      {/* Aggregate Rating */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-[var(--color-border)] rounded-sm">
              <p className="text-sm uppercase tracking-widest text-[var(--color-text-light)] mb-2">
                {t("averageRating")}
              </p>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-[family-name:var(--font-heading)] text-5xl">
                  {average}
                </span>
                <StarRating rating={Math.round(average)} size="lg" />
              </div>
              <p className="text-sm text-[var(--color-text-light)]">
                {t("basedOn", { count })}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Reviews List */}
      <section className="pb-[var(--spacing-section)] px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {reviews.map((review, idx) => (
            <ScrollReveal key={review.id} delay={idx * 0.1}>
              <div className="p-6 md:p-8 bg-white border border-[var(--color-border)] rounded-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-[family-name:var(--font-heading)] text-xl mb-1">
                      {review.title}
                    </h3>
                    <StarRating rating={review.rating} />
                  </div>
                  <div className="text-right text-sm text-[var(--color-text-light)] shrink-0">
                    <p className="font-medium text-[var(--color-text)]">
                      {review.guestName}
                    </p>
                    <p>{t("stayedIn", { room: review.roomTypeName })}</p>
                  </div>
                </div>

                <p className="text-[var(--color-text-light)] leading-relaxed mb-4">
                  {review.comment}
                </p>

                <div className="flex items-center justify-between text-xs text-[var(--color-text-light)]">
                  <time>
                    {t("stayDate", {
                      date: new Date(review.stayDate).toLocaleDateString(
                        locale === "vi" ? "vi-VN" : "en-US",
                        { year: "numeric", month: "long" }
                      ),
                    })}
                  </time>
                </div>

                {review.response && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs uppercase tracking-widest text-[var(--color-accent)] mb-2">
                      {t("hotelResponse")}
                    </p>
                    <p className="text-sm text-[var(--color-text-light)] italic">
                      {review.response}
                    </p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Write a Review CTA */}
        <ScrollReveal delay={0.3}>
          <div className="max-w-4xl mx-auto mt-12 text-center">
            <Link
              href="/reviews/submit"
              className="inline-flex items-center px-8 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-xs uppercase tracking-widest font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)]"
            >
              {t("writeReview")}
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
