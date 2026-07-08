"use client";

import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, Copy, Calendar, Clock, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/data/rooms";
import type { BookingData, BookingResult } from "./booking-wizard";

type Props = {
  result: BookingResult;
  bookingData: BookingData;
};

export function BookingSuccess({ result, bookingData }: Props) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetch("/api/payment/config")
      .then((res) => res.json())
      .then((data) => setPaymentEnabled(data.enabled))
      .catch(() => setPaymentEnabled(false));
  }, []);

  const handlePayNow = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCode: result.bookingCode }),
      });
      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch {
      setPaymentLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(result.bookingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
    <div className="max-w-lg mx-auto text-center space-y-6">
      {/* Success icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl md:text-3xl font-heading text-primary mb-2">
          {t("bookingSuccess")}
        </h2>
        <p className="text-text-light">{t("successMessage")}</p>
      </div>

      {/* Booking Code */}
      <div className="bg-surface-dim rounded-xl p-6">
        <p className="text-sm text-text-light mb-2">{t("bookingCode")}</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl md:text-3xl font-mono font-bold text-primary tracking-wider">
            {result.bookingCode}
          </span>
          <button
            onClick={copyCode}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Copy booking code"
          >
            <Copy className={`w-5 h-5 ${copied ? "text-success" : "text-muted"}`} />
          </button>
        </div>
        {copied && (
          <p className="text-xs text-success mt-1">{t("copied")}</p>
        )}
      </div>

      {/* Booking Details */}
      <div className="border border-border rounded-xl p-4 md:p-6 text-left space-y-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-accent" />
          <div>
            <span className="text-sm">
              {formatDate(result.checkIn)} → {formatDate(result.checkOut)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-sm text-text-light">
            {t("nights", { count: result.nights })} • {result.guestCount} {t("guestUnit")}
          </span>
        </div>
        <hr className="border-border" />
        <div className="flex justify-between items-center">
          <span className="text-text-light">{t("totalPrice")}</span>
          <span className="text-xl font-heading text-primary">
            {formatPrice(result.totalPrice, locale)}
          </span>
        </div>
      </div>

      {/* Payment Section */}
      {paymentEnabled && result.status === "PENDING" && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary font-medium">
            <CreditCard className="w-5 h-5" />
            <span>{t("payOnlineTitle")}</span>
          </div>
          <p className="text-sm text-text-light">
            {t("payOnlineDescription")}
          </p>
          <button
            onClick={handlePayNow}
            disabled={paymentLoading}
            className="w-full py-3 px-6 bg-accent text-primary-dark rounded-lg font-semibold
                       hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentLoading ? t("processing") : t("payNow")}
          </button>
        </div>
      )}

      {/* Expiration notice */}
      {!paymentEnabled && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm text-text-light">
          {t("expirationNotice")}
        </div>
      )}

      {paymentEnabled && result.status === "PENDING" && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-sm text-text-light">
          {t("paymentExpirationNotice")}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`/${locale}/booking/status?code=${result.bookingCode}`}
          className="flex-1 py-3 px-6 border border-border rounded-lg font-medium
                     hover:bg-surface-dim transition-all text-center"
        >
          {t("checkStatus")}
        </a>
        <a
          href={`/${locale}`}
          className="flex-1 py-3 px-6 bg-primary text-text-inverse rounded-lg font-medium
                     hover:bg-primary-light transition-all text-center"
        >
          {t("backToHome")}
        </a>
      </div>
    </div>
  );
}
