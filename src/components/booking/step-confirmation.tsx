"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Calendar, Users, User, Mail, Phone, CreditCard, Tag, X } from "lucide-react";
import { formatPrice } from "@/lib/data/rooms";
import type { BookingData, BookingResult } from "./booking-wizard";

type Props = {
  bookingData: BookingData;
  /** Code carried in from the promotions page, pre-filled but not yet applied */
  promoPrefill?: string;
  onPromoChange: (promoCode: string, discountAmount: number) => void;
  onConfirm: (result: BookingResult) => void;
  onBack: () => void;
};

export function StepConfirmation({
  bookingData,
  promoPrefill = "",
  onPromoChange,
  onConfirm,
  onBack,
}: Props) {
  const t = useTranslations("booking");
  const tRooms = useTranslations("roomTypes");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promoInput, setPromoInput] = useState(
    (bookingData.promoCode || promoPrefill).toUpperCase()
  );
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const { selectedRoom } = bookingData;
  if (!selectedRoom) return null;

  // Extract room type key
  const typeKey = selectedRoom.roomName.split(".")[1] || "";

  const nights = Math.ceil(
    (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const subtotal = selectedRoom.totalPrice;
  const discountAmount = bookingData.discountAmount;
  const finalTotal = subtotal - discountAmount;

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError("");

    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          roomSlug: selectedRoom.roomSlug,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        const reason = typeof data.reason === "string" ? data.reason : "notFound";
        setPromoError(t(`promo.errors.${reason}` as never));
        onPromoChange("", 0);
        return;
      }

      onPromoChange(data.code, data.discountAmount);
    } catch {
      setPromoError(t("errors.networkError"));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoInput("");
    setPromoError("");
    onPromoChange("", 0);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: selectedRoom.roomSlug,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
          guestCount: bookingData.guestCount,
          guestName: bookingData.guestName,
          guestEmail: bookingData.guestEmail,
          guestPhone: bookingData.guestPhone,
          specialRequests: bookingData.specialRequests,
          ...(bookingData.promoCode ? { promoCode: bookingData.promoCode } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("errors.bookingFailed"));
        return;
      }

      onConfirm(data.booking);
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-surface-dim transition-colors"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-5 h-5 text-text" />
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-heading text-primary">
            {t("steps.confirmTitle")}
          </h2>
          <p className="text-text-light text-sm">{t("steps.confirmSubtitle")}</p>
        </div>
      </div>

      {/* Booking Summary Card */}
      <div className="border border-border rounded-xl overflow-hidden bg-surface-bright">
        {/* Room info header */}
        <div className="flex items-center gap-4 p-4 md:p-6 border-b border-border">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={selectedRoom.images[0]?.src || ""}
              alt={typeKey ? tRooms(`${typeKey}.name`) : "Room"}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-heading text-lg text-primary">
              {typeKey ? tRooms(`${typeKey}.name`) : selectedRoom.roomSlug}
            </h3>
            <p className="text-sm text-text-light">
              {selectedRoom.size} m² • {selectedRoom.maxGuests} {t("guestUnit")}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-accent mt-0.5" />
              <div>
                <p className="text-xs text-text-light uppercase tracking-wide">{t("checkIn")}</p>
                <p className="text-sm font-medium">{formatDate(bookingData.checkIn)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-accent mt-0.5" />
              <div>
                <p className="text-xs text-text-light uppercase tracking-wide">{t("checkOut")}</p>
                <p className="text-sm font-medium">{formatDate(bookingData.checkOut)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-4 h-4 text-accent mt-0.5" />
              <div>
                <p className="text-xs text-text-light uppercase tracking-wide">{t("guests")}</p>
                <p className="text-sm font-medium">{bookingData.guestCount} {t("guestUnit")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-accent mt-0.5" />
              <div>
                <p className="text-xs text-text-light uppercase tracking-wide">{t("duration")}</p>
                <p className="text-sm font-medium">{t("nights", { count: nights })}</p>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Guest info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-text uppercase tracking-wide">
              {t("guestInfo")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted" />
                {bookingData.guestName}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted" />
                {bookingData.guestEmail}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted" />
                {bookingData.guestPhone}
              </div>
            </div>
            {bookingData.specialRequests && (
              <p className="text-sm text-text-light italic">
                &ldquo;{bookingData.specialRequests}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Promo code */}
        <div className="p-4 md:p-6 border-t border-border space-y-3">
          <label
            htmlFor="promoCode"
            className="flex items-center gap-2 text-sm font-medium text-text uppercase tracking-wide"
          >
            <Tag className="w-4 h-4 text-accent" />
            {t("promo.label")}
          </label>

          {bookingData.promoCode ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
              <span className="text-sm text-success">
                {t("promo.applied", { code: bookingData.promoCode })}
              </span>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="p-1 rounded-full hover:bg-success/20 transition-colors"
                aria-label={t("promo.remove")}
              >
                <X className="w-4 h-4 text-success" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="promoCode"
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder={t("promo.placeholder")}
                className="flex-1 px-4 py-3 border border-border rounded-lg bg-surface-bright
                           focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                           transition-all text-text uppercase tracking-wider"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-6 py-3 bg-primary text-text-inverse rounded-lg font-medium
                           hover:bg-primary-light transition-all duration-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promoLoading ? t("promo.applying") : t("promo.apply")}
              </button>
            </div>
          )}

          {promoError && <p className="text-sm text-error">{promoError}</p>}
        </div>

        {/* Total Price */}
        <div className="p-4 md:p-6 bg-surface-dim border-t border-border space-y-2">
          {discountAmount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-text-light">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(subtotal, locale)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-success">
                <span>{t("promo.discount", { code: bookingData.promoCode })}</span>
                <span>-{formatPrice(discountAmount, locale)}</span>
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <span className="text-text-light">{t("totalPrice")}</span>
            <span className="text-2xl font-heading text-primary">
              {formatPrice(finalTotal, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      {/* Policy notice */}
      <p className="text-xs text-text-light text-center">
        {t("policyNotice")}
      </p>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full py-4 bg-accent text-primary-dark rounded-lg font-medium text-lg
                   hover:bg-accent-light transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? t("processing") : t("confirmBooking")}
      </button>
    </div>
  );
}
