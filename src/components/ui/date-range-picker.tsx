"use client";

import { useState, useEffect } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { vi, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  onSelect: (checkIn: Date | undefined, checkOut: Date | undefined) => void;
  minDate?: Date;
  locale?: string;
};

export function DateRangePicker({
  checkIn,
  checkOut,
  onSelect,
  minDate,
  locale = "vi",
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const selected: DateRange | undefined =
    checkIn || checkOut ? { from: checkIn, to: checkOut } : undefined;

  const handleSelect = (range: DateRange | undefined) => {
    onSelect(range?.from ?? undefined, range?.to ?? undefined);
  };

  const dateLocale = locale === "vi" ? vi : enUS;
  const disabledDays = { before: minDate ?? new Date() };

  return (
    <div className="luxury-card p-4 sm:p-6 overflow-hidden">
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        locale={dateLocale}
        numberOfMonths={isMobile ? 1 : 2}
        disabled={disabledDays}
        showOutsideDays
        classNames={{
          root: "w-full",
          months: "flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center",
          month: "flex flex-col gap-3",
          month_caption: "flex justify-center items-center h-10 relative",
          caption_label: "font-heading text-lg sm:text-xl text-primary font-medium",
          nav: "flex items-center justify-between absolute inset-x-0 top-0 h-10 px-1",
          button_previous:
            "inline-flex items-center justify-center w-9 h-9 rounded-full text-accent hover:bg-accent/10 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-transparent",
          button_next:
            "inline-flex items-center justify-center w-9 h-9 rounded-full text-accent hover:bg-accent/10 transition-colors duration-300 disabled:opacity-30 disabled:hover:bg-transparent",
          chevron: "w-5 h-5",
          month_grid: "w-full border-collapse",
          weekdays: "flex",
          weekday:
            "w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-xs font-medium text-text-light uppercase tracking-wider",
          week: "flex",
          day: "relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-sm p-0",
          day_button:
            "w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-medium transition-all duration-200 hover:bg-accent/10 hover:text-accent-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30",
          today: "font-bold [&>button]:border [&>button]:border-accent/40",
          outside: "opacity-30",
          disabled:
            "[&>button]:text-muted-light [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:text-muted-light",
          hidden: "invisible",
          range_start:
            "[&>button]:bg-accent [&>button]:text-white [&>button]:hover:bg-accent-dark [&>button]:shadow-sm",
          range_end:
            "[&>button]:bg-accent [&>button]:text-white [&>button]:hover:bg-accent-dark [&>button]:shadow-sm",
          range_middle:
            "[&>button]:bg-accent/15 [&>button]:text-accent-dark [&>button]:rounded-full [&>button]:hover:bg-accent/25",
          selected:
            "[&>button]:bg-accent [&>button]:text-white [&>button]:hover:bg-accent-dark",
        }}
        components={{
          Chevron: ({ orientation }) => {
            return orientation === "left" ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            );
          },
        }}
      />
    </div>
  );
}
