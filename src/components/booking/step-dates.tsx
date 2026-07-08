"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, Users, Search } from "lucide-react";
import { format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { BookingData, AvailableRoom } from "./booking-wizard";

type Props = {
  initialData: BookingData;
  onSubmit: (data: {
    checkIn: string;
    checkOut: string;
    guestCount: number;
    rooms: AvailableRoom[];
  }) => void;
};

export function StepDates({ initialData, onSubmit }: Props) {
  const t = useTranslations("booking");
  const locale = useLocale();

  const [checkIn, setCheckIn] = useState<Date | undefined>(
    initialData.checkIn ? new Date(initialData.checkIn) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    initialData.checkOut ? new Date(initialData.checkOut) : undefined
  );
  const [guestCount, setGuestCount] = useState(initialData.guestCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dateLocale = locale === "vi" ? vi : enUS;

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return format(date, "EEEE, d MMMM yyyy", { locale: dateLocale });
  };

  const toDateStr = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  const handleSelect = (from: Date | undefined, to: Date | undefined) => {
    setCheckIn(from);
    setCheckOut(to);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const checkInStr = toDateStr(checkIn);
    const checkOutStr = toDateStr(checkOut);

    try {
      const res = await fetch("/api/bookings/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: checkInStr,
          checkOut: checkOutStr,
          guestCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("errors.checkFailed"));
        return;
      }

      if (data.rooms.length === 0) {
        setError(t("errors.noRooms"));
        return;
      }

      onSubmit({
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guestCount,
        rooms: data.rooms,
      });
    } catch {
      setError(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-heading text-primary mb-2">
          {t("steps.datesTitle")}
        </h2>
        <p className="text-text-light">{t("steps.datesSubtitle")}</p>
      </div>

      {/* Selected dates display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-dim border border-border">
          <Calendar className="w-4 h-4 text-accent shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-text-light uppercase tracking-wider">
              {t("checkIn")}
            </p>
            <p className="text-sm font-medium text-text truncate">
              {formatDate(checkIn)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-dim border border-border">
          <Calendar className="w-4 h-4 text-accent shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-text-light uppercase tracking-wider">
              {t("checkOut")}
            </p>
            <p className="text-sm font-medium text-text truncate">
              {formatDate(checkOut)}
            </p>
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onSelect={handleSelect}
        locale={locale}
      />

      {/* Nights display */}
      {nights > 0 && (
        <div className="text-center py-3 bg-surface-dim rounded-lg">
          <span className="text-text-light">
            {t("nights", { count: nights })}
          </span>
        </div>
      )}

      {/* Guest Count */}
      <div className="space-y-2">
        <label
          htmlFor="guestCount"
          className="flex items-center gap-2 text-sm font-medium text-text"
        >
          <Users className="w-4 h-4 text-accent" />
          {t("guests")}
        </label>
        <select
          id="guestCount"
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
          className="w-full px-4 py-3 border border-border rounded-lg bg-surface-bright
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-all text-text"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {t("guestUnit")}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !checkIn || !checkOut}
        className="w-full py-4 bg-primary text-text-inverse rounded-lg font-medium
                   hover:bg-primary-light transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="animate-pulse">{t("checking")}</span>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {t("checkAvailability")}
          </>
        )}
      </button>
    </form>
  );
}
