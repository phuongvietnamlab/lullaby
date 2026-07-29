"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { uploadImage, UploadError } from "@/lib/upload";

const inputClass =
  "w-full px-4 py-3 border border-[var(--color-border)] rounded-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors";

const COMMENT_MIN = 20;
const COMMENT_MAX = 1000;
const MAX_PHOTOS = 5;

type Status = "idle" | "sending" | "success" | "error";

type VerifiedBooking = {
  bookingId: string;
  bookingCode: string;
  guestName: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
  roomTypeNameEn: string | null;
};

export default function ReviewSubmitPage() {
  const t = useTranslations("reviews");
  const locale = useLocale();

  // Step 1 — verification gate
  const [bookingCode, setBookingCode] = useState("");
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [booking, setBooking] = useState<VerifiedBooking | null>(null);
  const [verifyErrorKey, setVerifyErrorKey] = useState<string | null>(null);

  // Step 2 — review form
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [commentTouched, setCommentTouched] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [submitErrorKey, setSubmitErrorKey] = useState<string | null>(null);

  // API error key → localized message. Keys match the verify/submit route
  // handlers (verify.error* / form.error*). Mirrors contact-form.tsx:53-58.
  const errorMessages: Record<string, string> = {
    invalidInput: t("verify.errorInvalidCode"),
    rateLimited: t("form.errorSubmit"),
    errorInvalidCode: t("verify.errorInvalidCode"),
    errorEmailMismatch: t("verify.errorEmailMismatch"),
    errorIneligible: t("verify.errorIneligible"),
    errorAlreadyReviewed: t("verify.errorAlreadyReviewed"),
    errorRating: t("form.errorRating"),
    errorCommentShort: t("form.errorCommentShort"),
    errorCommentLong: t("form.errorCommentLong"),
    errorPhotoSize: t("form.errorPhotoSize"),
    errorPhotoType: t("form.errorPhotoType"),
    errorPhotoUpload: t("form.errorPhotoUpload"),
    errorSubmit: t("form.errorSubmit"),
  };

  const messageFor = (key: string | null) =>
    (key && errorMessages[key]) || errorMessages.errorSubmit;

  const commentLength = comment.trim().length;
  const commentTooShort = commentLength < COMMENT_MIN;
  const commentTooLong = comment.length > COMMENT_MAX;
  const roomTypeLabel =
    (locale === "en" ? booking?.roomTypeNameEn : booking?.roomTypeName) ?? "";

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verifying || !bookingCode.trim() || !email.trim()) return;
    setVerifying(true);
    setVerifyErrorKey(null);

    try {
      const res = await fetch("/api/reviews/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCode: bookingCode.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setVerifyErrorKey(typeof data.error === "string" ? data.error : "errorSubmit");
        return;
      }

      setBooking(data.booking as VerifiedBooking);
      setGuestName(data.booking?.guestName ?? "");
      setVerified(true);
    } catch {
      setVerifyErrorKey("errorSubmit");
    } finally {
      setVerifying(false);
    }
  }

  async function handlePhotoSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoError("photoMax");
      return;
    }
    const selected = Array.from(files).slice(0, room);
    for (const file of selected) {
      setUploadingCount((c) => c + 1);
      try {
        const url = await uploadImage(file, "reviews");
        setPhotos((p) => [...p, url]);
      } catch (err) {
        if (err instanceof UploadError && /type|jpg|png|webp/i.test(err.message)) {
          setPhotoError("errorPhotoType");
        } else if (err instanceof UploadError && /large|5mb|size/i.test(err.message)) {
          setPhotoError("errorPhotoSize");
        } else {
          setPhotoError("errorPhotoUpload");
        }
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      status === "sending" ||
      !verified ||
      !booking ||
      rating === 0 ||
      commentTooShort ||
      commentTooLong ||
      uploadingCount > 0
    ) {
      return;
    }
    setStatus("sending");
    setSubmitErrorKey(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          rating,
          comment: comment.trim(),
          guestName: guestName.trim(),
          photos,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitErrorKey(typeof data.error === "string" ? data.error : "errorSubmit");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setSubmitErrorKey("errorSubmit");
      setStatus("error");
    }
  }

  // Confirmation — awaiting approval (REV-04)
  if (status === "success") {
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
          <p className="text-[var(--color-text-light)]">{t("form.successBody")}</p>
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

      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* STEP 1 — Verification gate */}
          {!verified ? (
            <ScrollReveal>
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl mb-2">
                    {t("verify.title")}
                  </h2>
                  <p className="text-[var(--color-text-light)]">
                    {t("verify.subtitle")}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="bookingCode" className="block text-sm font-medium mb-2">
                      {t("verify.bookingCode")}
                    </label>
                    <input
                      type="text"
                      id="bookingCode"
                      required
                      value={bookingCode}
                      onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                      placeholder={t("verify.bookingCodePlaceholder")}
                      aria-invalid={
                        verifyErrorKey === "errorInvalidCode" ||
                        verifyErrorKey === "errorIneligible" ||
                        verifyErrorKey === "errorAlreadyReviewed"
                      }
                      aria-describedby={verifyErrorKey ? "verify-error" : undefined}
                      className={`${inputClass} ${
                        verifyErrorKey && verifyErrorKey !== "errorEmailMismatch"
                          ? "border-[var(--color-error)]"
                          : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      {t("form.email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("form.emailPlaceholder")}
                      aria-invalid={verifyErrorKey === "errorEmailMismatch"}
                      aria-describedby={verifyErrorKey ? "verify-error" : undefined}
                      className={`${inputClass} ${
                        verifyErrorKey === "errorEmailMismatch"
                          ? "border-[var(--color-error)]"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                {verifyErrorKey && (
                  <p id="verify-error" role="alert" className="text-sm text-[var(--color-error)]">
                    {messageFor(verifyErrorKey)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={verifying || !bookingCode.trim() || !email.trim()}
                  className="w-full px-8 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-sm uppercase tracking-widest font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? t("verify.verifying") : t("verify.submit")}
                </button>
              </form>
            </ScrollReveal>
          ) : (
            /* Verified badge — collapsed Step 1 */
            <div className="flex items-center gap-3 p-4 rounded-sm bg-[var(--color-success)]/10 border border-[var(--color-success)]/30">
              <svg className="w-5 h-5 shrink-0 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-[var(--color-success)]">
                {t("verify.verifiedBadge", { code: booking?.bookingCode ?? "" })}
              </span>
            </div>
          )}

          {/* STEP 2 — Review form (revealed after verify) */}
          {verified && booking && (
            <ScrollReveal>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("form.rating")}
                  </label>
                  <div role="radiogroup" aria-label={t("form.rating")} className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                        aria-label={t("stars", { count: star })}
                        aria-checked={rating === star}
                        role="radio"
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

                {/* Comment */}
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium mb-2">
                    {t("form.comment")}
                  </label>
                  <textarea
                    id="comment"
                    rows={5}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onBlur={() => setCommentTouched(true)}
                    placeholder={t("form.commentPlaceholder")}
                    maxLength={COMMENT_MAX}
                    aria-invalid={(commentTouched && commentTooShort) || commentTooLong}
                    className={`${inputClass} resize-none`}
                  />
                  <div
                    className={`mt-1 text-xs text-right ${
                      (commentTouched && commentTooShort) || commentTooLong
                        ? "text-[var(--color-error)]"
                        : "text-[var(--color-text-light)]"
                    }`}
                  >
                    {commentTouched && commentTooShort
                      ? t("form.errorCommentShort")
                      : `${comment.length} / ${COMMENT_MAX}`}
                  </div>
                </div>

                {/* Display name (editable, pre-filled) */}
                <div>
                  <label htmlFor="guestName" className="block text-sm font-medium mb-2">
                    {t("form.name")}
                  </label>
                  <input
                    type="text"
                    id="guestName"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-light)]">
                    {t("form.nameHelper")}
                  </p>
                </div>

                {/* Room type (LOCKED, read-only) */}
                <div>
                  <label htmlFor="roomType" className="block text-sm font-medium mb-2">
                    {t("form.roomType")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="roomType"
                      value={roomTypeLabel}
                      readOnly
                      aria-readonly="true"
                      tabIndex={-1}
                      className="w-full px-4 py-3 pr-11 border border-[var(--color-border)] rounded-sm bg-[var(--color-surface-dim)] text-[var(--color-text-light)] cursor-default"
                    />
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-light)]">
                    {t("form.roomLockedHelper")}
                  </p>
                </div>

                {/* Photos (optional, max 5) */}
                <div>
                  <label htmlFor="photos" className="block text-sm font-medium mb-2">
                    {t("form.photoPrompt")}
                  </label>
                  {photos.length < MAX_PHOTOS ? (
                    <label
                      htmlFor="photos"
                      className="flex flex-col items-center justify-center gap-2 px-4 py-8 border border-dashed border-[var(--color-border)] rounded-sm bg-[var(--color-surface-bright)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors text-center"
                    >
                      <svg className="w-6 h-6 text-[var(--color-text-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-[var(--color-text-light)]">
                        {t("form.photoHint")}
                      </span>
                      <input
                        type="file"
                        id="photos"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          handlePhotoSelect(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : (
                    <p className="px-4 py-3 border border-[var(--color-border)] rounded-sm bg-[var(--color-surface-dim)] text-xs text-[var(--color-text-light)] text-center">
                      {t("form.photoMax")}
                    </p>
                  )}

                  {photoError && (
                    <p role="alert" className="mt-2 text-xs text-[var(--color-error)]">
                      {messageFor(photoError)}
                    </p>
                  )}

                  {(photos.length > 0 || uploadingCount > 0) && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {photos.map((url, i) => (
                        <div
                          key={url}
                          className="relative aspect-square rounded-sm border border-[var(--color-border)] overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            aria-label={t("form.removePhoto")}
                            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--color-primary)]/70 text-white hover:bg-[var(--color-error)] transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {Array.from({ length: uploadingCount }).map((_, i) => (
                        <div
                          key={`uploading-${i}`}
                          className="aspect-square rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-dim)] flex items-center justify-center opacity-70"
                        >
                          <svg className="w-5 h-5 animate-spin text-[var(--color-text-light)]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  aria-hidden="true"
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute left-[-9999px] w-px h-px opacity-0"
                />

                {status === "error" && (
                  <p role="alert" className="p-4 text-sm rounded-sm bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-[var(--color-error)]">
                    {messageFor(submitErrorKey)}
                  </p>
                )}

                {/* Submit */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={
                      rating === 0 ||
                      !verified ||
                      commentTooShort ||
                      commentTooLong ||
                      uploadingCount > 0 ||
                      status === "sending"
                    }
                    className="w-full px-8 py-4 bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-sm uppercase tracking-widest font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-luxury)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? t("form.submitting") : t("form.submit")}
                  </button>
                </div>
              </form>
            </ScrollReveal>
          )}
        </div>
      </section>
    </>
  );
}
