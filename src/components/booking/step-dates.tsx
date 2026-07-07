"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Users, Search } from "lucide-react";
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
  const [checkIn, setCheckIn] = useState(initialData.checkIn);
  const [checkOut, setCheckOut] = useState(initialData.checkOut);
  const [guestCount, setGuestCount] = useState(initialData.guestCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Minimum date is today
  const today = new Date().toISOString().split("T")[0];

  // Minimum checkout is day after check-in
  const minCheckOut = checkIn
    ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split("T")[0]
    : today;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/bookings/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, guestCount }),
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
        checkIn,
        checkOut,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Check-in Date */}
        <div className="space-y-2">
          <label
            htmlFor="checkIn"
            className="flex items-center gap-2 text-sm font-medium text-text"
          >
            <Calendar className="w-4 h-4 text-accent" />
            {t("checkIn")}
          </label>
          <input
            type="date"
            id="checkIn"
            value={checkIn}
            min={today}
            onChange={(e) => {
              setCheckIn(e.target.value);
              // Reset checkout if it's before new check-in
              if (checkOut && e.target.value >= checkOut) {
                setCheckOut("");
              }
            }}
            required
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-bright
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                       transition-all text-text"
          />
        </div>

        {/* Check-out Date */}
        <div className="space-y-2">
          <label
            htmlFor="checkOut"
            className="flex items-center gap-2 text-sm font-medium text-text"
          >
            <Calendar className="w-4 h-4 text-accent" />
            {t("checkOut")}
          </label>
          <input
            type="date"
            id="checkOut"
            value={checkOut}
            min={minCheckOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface-bright
                       focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                       transition-all text-text"
          />
        </div>
      </div>

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

      {/* Nights display */}
      {checkIn && checkOut && (
        <div className="text-center py-3 bg-surface-dim rounded-lg">
          <span className="text-text-light">
            {t("nights", {
              count: Math.ceil(
                (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
                  (1000 * 60 * 60 * 24)
              ),
            })}
          </span>
        </div>
      )}

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
