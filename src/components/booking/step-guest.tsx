"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, User, Mail, Phone, MessageSquare } from "lucide-react";
import type { BookingData } from "./booking-wizard";

type Props = {
  initialData: BookingData;
  onSubmit: (data: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests: string;
  }) => void;
  onBack: () => void;
};

export function StepGuest({ initialData, onSubmit, onBack }: Props) {
  const t = useTranslations("booking");
  const [guestName, setGuestName] = useState(initialData.guestName);
  const [guestEmail, setGuestEmail] = useState(initialData.guestEmail);
  const [guestPhone, setGuestPhone] = useState(initialData.guestPhone);
  const [specialRequests, setSpecialRequests] = useState(initialData.specialRequests);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!guestName || guestName.length < 2) {
      newErrors.guestName = t("validation.nameRequired");
    }
    if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      newErrors.guestEmail = t("validation.emailInvalid");
    }
    if (!guestPhone || guestPhone.length < 8) {
      newErrors.guestPhone = t("validation.phoneRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ guestName, guestEmail, guestPhone, specialRequests });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-full hover:bg-surface-dim transition-colors"
          aria-label={t("back")}
        >
          <ArrowLeft className="w-5 h-5 text-text" />
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-heading text-primary">
            {t("steps.guestTitle")}
          </h2>
          <p className="text-text-light text-sm">{t("steps.guestSubtitle")}</p>
        </div>
      </div>

      {/* Guest Name */}
      <div className="space-y-2">
        <label htmlFor="guestName" className="flex items-center gap-2 text-sm font-medium text-text">
          <User className="w-4 h-4 text-accent" />
          {t("name")} *
        </label>
        <input
          type="text"
          id="guestName"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder={t("placeholders.name")}
          className={`w-full px-4 py-3 border rounded-lg bg-surface-bright
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-all text-text ${errors.guestName ? "border-error" : "border-border"}`}
        />
        {errors.guestName && (
          <p className="text-xs text-error">{errors.guestName}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label htmlFor="guestEmail" className="flex items-center gap-2 text-sm font-medium text-text">
          <Mail className="w-4 h-4 text-accent" />
          {t("email")} *
        </label>
        <input
          type="email"
          id="guestEmail"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder={t("placeholders.email")}
          className={`w-full px-4 py-3 border rounded-lg bg-surface-bright
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-all text-text ${errors.guestEmail ? "border-error" : "border-border"}`}
        />
        {errors.guestEmail && (
          <p className="text-xs text-error">{errors.guestEmail}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label htmlFor="guestPhone" className="flex items-center gap-2 text-sm font-medium text-text">
          <Phone className="w-4 h-4 text-accent" />
          {t("phone")} *
        </label>
        <input
          type="tel"
          id="guestPhone"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          placeholder={t("placeholders.phone")}
          className={`w-full px-4 py-3 border rounded-lg bg-surface-bright
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-all text-text ${errors.guestPhone ? "border-error" : "border-border"}`}
        />
        {errors.guestPhone && (
          <p className="text-xs text-error">{errors.guestPhone}</p>
        )}
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <label htmlFor="specialRequests" className="flex items-center gap-2 text-sm font-medium text-text">
          <MessageSquare className="w-4 h-4 text-accent" />
          {t("specialRequests")}
        </label>
        <textarea
          id="specialRequests"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder={t("placeholders.specialRequests")}
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-lg bg-surface-bright
                     focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                     transition-all text-text resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-4 bg-primary text-text-inverse rounded-lg font-medium
                   hover:bg-primary-light transition-all duration-300"
      >
        {t("continue")}
      </button>
    </form>
  );
}
