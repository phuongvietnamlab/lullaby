"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Search, Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Hourglass } from "lucide-react";
import { formatPrice } from "@/lib/data/rooms";

type BookingStatus = {
  bookingCode: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guestName: string;
  guestEmail: string;
  totalPrice: number;
  specialRequests: string;
  createdAt: string;
  expiresAt: string;
  room: {
    name: string;
    slug: string;
    images: { src: string; alt: string }[];
  } | null;
};

const STATUS_CONFIG = {
  PENDING: { icon: Hourglass, color: "text-warning", bg: "bg-warning/10" },
  CONFIRMED: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  CANCELLED: { icon: XCircle, color: "text-error", bg: "bg-error/10" },
  EXPIRED: { icon: AlertCircle, color: "text-muted", bg: "bg-surface-dim" },
};

export function BookingStatusChecker() {
  const t = useTranslations("booking");
  const tRooms = useTranslations("roomTypes");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [code, setCode] = useState(searchParams.get("code") || "");
  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Auto-search if code is in URL
  useEffect(() => {
    if (searchParams.get("code")) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setBooking(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error === "Booking not found" ? t("status.notFound") : data.error);
        return;
      }

      setBooking(data.booking);
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

  const getRoomTypeKey = (nameKey: string) => {
    const parts = nameKey.split(".");
    return parts[1] || "";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-heading text-primary mb-3">
          {t("status.title")}
        </h1>
        <div className="luxury-divider mx-auto mb-4" />
        <p className="text-text-light">{t("status.subtitle")}</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("status.placeholder")}
          className="flex-1 px-4 py-3 border border-border rounded-lg bg-surface-bright
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-all text-text font-mono uppercase"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-6 py-3 bg-primary text-text-inverse rounded-lg font-medium
                     hover:bg-primary-light transition-all disabled:opacity-50
                     flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">{t("status.search")}</span>
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm text-center">
          {error}
        </div>
      )}

      {/* No result */}
      {searched && !loading && !booking && !error && (
        <div className="text-center py-8 text-text-light">
          {t("status.notFound")}
        </div>
      )}

      {/* Booking Details */}
      {booking && (
        <div className="border border-border rounded-xl overflow-hidden bg-surface-bright">
          {/* Status badge */}
          <div className={`px-6 py-4 ${STATUS_CONFIG[booking.status].bg} flex items-center gap-3`}>
            {(() => {
              const StatusIcon = STATUS_CONFIG[booking.status].icon;
              return <StatusIcon className={`w-5 h-5 ${STATUS_CONFIG[booking.status].color}`} />;
            })()}
            <div>
              <p className={`font-medium ${STATUS_CONFIG[booking.status].color}`}>
                {t(`status.statuses.${booking.status}`)}
              </p>
              {booking.status === "PENDING" && (
                <p className="text-xs text-text-light">
                  {t("status.expiresAt", { date: formatDate(booking.expiresAt) })}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Booking code */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-light">{t("bookingCode")}</span>
              <span className="font-mono font-bold text-primary">{booking.bookingCode}</span>
            </div>

            {/* Room */}
            {booking.room && (
              <div className="flex items-center gap-3 p-3 bg-surface-dim rounded-lg">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={booking.room.images[0]?.src || ""}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-primary">
                    {(() => {
                      const key = getRoomTypeKey(booking.room!.name);
                      return key ? tRooms(`${key}.name`) : booking.room!.slug;
                    })()}
                  </p>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-xs text-text-light">{t("checkIn")}</p>
                  <p className="text-sm font-medium">{formatDate(booking.checkIn)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="text-xs text-text-light">{t("checkOut")}</p>
                  <p className="text-sm font-medium">{formatDate(booking.checkOut)}</p>
                </div>
              </div>
            </div>

            {/* Guest info */}
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted" />
              {booking.guestName} • {booking.guestCount} {t("guestUnit")}
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-text-light">{t("totalPrice")}</span>
              <span className="text-xl font-heading text-primary">
                {formatPrice(booking.totalPrice, locale)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
