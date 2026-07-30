import { useTranslations } from "next-intl";
import { type PublicReview } from "@/lib/data/reviews";
import { StarRating } from "./star-rating";

/**
 * Shared review card rendering one PublicReview: star rating, guest name, room,
 * verbatim comment, stay date, and optional hotel response.
 *
 * - The comment body is rendered as a React text child ({review.comment}),
 *   which React auto-escapes — NEVER via dangerouslySetInnerHTML (Security V5,
 *   T-11-05).
 * - A localized Verified badge (D-03/D-04) shows only when review.verified.
 *   The badge label is chrome, so it switches by locale (t("verified")); the
 *   comment body itself is never translated (D-05).
 * - Runs as a server component: useTranslations works in RSC because the pages
 *   consuming this card set the request locale upstream (setRequestLocale).
 */
export function ReviewCard({
  review,
  locale,
}: {
  review: PublicReview;
  locale: string;
}) {
  const t = useTranslations("reviews");

  return (
    <div className="p-6 md:p-8 bg-white border border-[var(--color-border)] rounded-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="shrink-0">
          <StarRating rating={review.rating} />
        </div>
        <div className="min-w-0 text-right text-sm text-[var(--color-text-light)]">
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <p className="font-medium text-[var(--color-text)] break-words">{review.guestName}</p>
            {review.verified && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-widest font-medium text-[var(--color-accent)] border border-[var(--color-accent)]">
                {t("verified")}
              </span>
            )}
          </div>
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
  );
}
