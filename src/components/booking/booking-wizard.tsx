"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StepDates } from "./step-dates";
import { StepRooms } from "./step-rooms";
import { StepGuest } from "./step-guest";
import { StepConfirmation } from "./step-confirmation";
import { BookingSuccess } from "./booking-success";

export type BookingData = {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  selectedRoom: AvailableRoom | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;
};

export type AvailableRoom = {
  roomId: string;
  roomSlug: string;
  roomName: string;
  basePrice: number;
  totalPrice: number;
  nights: number;
  maxGuests: number;
  size: number;
  available: number;
  images: { src: string; alt: string }[];
  amenities: string[];
  highlights: string[];
};

export type BookingResult = {
  bookingCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  totalPrice: number;
  nights: number;
  expiresAt: string;
};

const STEPS = ["dates", "rooms", "guest", "confirmation"] as const;
type Step = (typeof STEPS)[number];

export function BookingWizard() {
  const t = useTranslations("booking");
  const [currentStep, setCurrentStep] = useState<Step>("dates");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [bookingData, setBookingData] = useState<BookingData>({
    checkIn: "",
    checkOut: "",
    guestCount: 2,
    selectedRoom: null,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequests: "",
  });

  const stepIndex = STEPS.indexOf(currentStep);

  const goToStep = (step: Step) => setCurrentStep(step);

  const handleDatesSubmit = (data: {
    checkIn: string;
    checkOut: string;
    guestCount: number;
    rooms: AvailableRoom[];
  }) => {
    setBookingData((prev) => ({
      ...prev,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guestCount: data.guestCount,
    }));
    setAvailableRooms(data.rooms);
    goToStep("rooms");
  };

  const handleRoomSelect = (room: AvailableRoom) => {
    setBookingData((prev) => ({ ...prev, selectedRoom: room }));
    goToStep("guest");
  };

  const handleGuestSubmit = (data: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests: string;
  }) => {
    setBookingData((prev) => ({ ...prev, ...data }));
    goToStep("confirmation");
  };

  const handleBookingConfirmed = (result: BookingResult) => {
    setBookingResult(result);
  };

  if (bookingResult) {
    return <BookingSuccess result={bookingResult} bookingData={bookingData} />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  index <= stepIndex
                    ? "bg-accent text-primary-dark"
                    : "bg-surface-dim text-muted"
                }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 md:w-16 h-0.5 mx-1 md:mx-2 transition-all duration-300 ${
                    index < stepIndex ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between max-w-md mx-auto mt-2">
          {STEPS.map((step) => (
            <span
              key={step}
              className="text-xs text-text-light hidden md:block"
            >
              {t(`steps.${step}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === "dates" && (
          <StepDates
            initialData={bookingData}
            onSubmit={handleDatesSubmit}
          />
        )}
        {currentStep === "rooms" && (
          <StepRooms
            rooms={availableRooms}
            checkIn={bookingData.checkIn}
            checkOut={bookingData.checkOut}
            onSelect={handleRoomSelect}
            onBack={() => goToStep("dates")}
          />
        )}
        {currentStep === "guest" && (
          <StepGuest
            initialData={bookingData}
            onSubmit={handleGuestSubmit}
            onBack={() => goToStep("rooms")}
          />
        )}
        {currentStep === "confirmation" && (
          <StepConfirmation
            bookingData={bookingData}
            onConfirm={handleBookingConfirmed}
            onBack={() => goToStep("guest")}
          />
        )}
      </div>
    </div>
  );
}
