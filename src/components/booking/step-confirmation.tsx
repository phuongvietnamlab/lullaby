"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Calendar, Users, User, Mail, Phone, CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/data/rooms";
import type { BookingData, BookingResult } from "./booking-wizard";

type Props = {
  bookingData: BookingData;
  onConfirm: (result: BookingResult) => void;
  onBack: () => void;
};

export function StepConfirmation({ bookingData, onConfirm, onBack }: Props) {
  const t = useTranslations("booking");
  const tRooms = useTranslations("roomTypes");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { selectedRoom } = bookingData;
  if (!selectedRoom) return null;

  // Extract room type key
  const typeKey = selectedRoom.roomName.split(".")[1] || "";

  const nights = Math.ceil(
    (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

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

        {/* Total Price */}
        <div className="p-4 md:p-6 bg-surface-dim border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-text-light">{t("totalPrice")}</span>
            <span className="text-2xl font-heading text-primary">
              {formatPrice(selectedRoom.totalPrice, locale)}
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
