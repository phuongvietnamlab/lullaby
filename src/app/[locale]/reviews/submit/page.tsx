"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const roomTypes = [
  "Superior Sea View",
  "Deluxe Bay View",
  "Premium Ocean Suite",
  "Executive Suite",
  "Presidential Suite",
];

export default function ReviewSubmitPage() {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  if (submitted) {
    return (
      <section className="pt-32 pb-[var(--spacing-section)] px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-[var(--color-success)]/10">
            <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl mb-4">
            {t("form.success")}
          </h1>
          <Link
            href="/reviews"
            className="inline-flex items-center px-6 py-3 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs uppercase tracking-widest hover:bg-[var(--color-primary)] hover:text-white transition-all duration-[var(--duration-normal)] mt-6"
          >
            ← {t("title")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-12 px-4 bg-[var(--color-surface-dim)]">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl mb-4">
              {t("submitTitle")}
            </h1>
            <p className="text-[var(--color-text-light)] text-lg max-w-2xl mx-auto">
              {t("submitSubtitle")}
            </p>
            <div className="luxury-divider mx-auto mt-6" />
          </ScrollReveal>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name & Email */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.name")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("form.namePlaceholder")}
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.email")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t("form.emailPlaceholder")}
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Room Type & Stay Date */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.roomType")}
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors bg-white"
                  >
                    <option value="">{t("selectRoom")}</option>
                    {roomTypes.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.stayDate")}
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("form.rating")}
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={t("stars", { count: star })}
                    >
                      <svg
                        className={`w-8 h-8 ${
                          star <= (hoveredRating || rating)
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-border)]"
                        } transition-colors`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("form.reviewTitle")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("form.titlePlaceholder")}
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("form.comment")}
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder={t("form.commentPlaceholder")}
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full px-8 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-sm uppercase tracking-widest font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("form.submitting") : t("form.submit")}
                </button>
              </div>
            </form>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
