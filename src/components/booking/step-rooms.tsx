"use client";

import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Users, Maximize2, Check } from "lucide-react";
import { formatPrice } from "@/lib/data/rooms";
import type { AvailableRoom } from "./booking-wizard";

type Props = {
  rooms: AvailableRoom[];
  checkIn: string;
  checkOut: string;
  onSelect: (room: AvailableRoom) => void;
  onBack: () => void;
};

export function StepRooms({ rooms, checkIn, checkOut, onSelect, onBack }: Props) {
  const t = useTranslations("booking");
  const tRooms = useTranslations("roomTypes");
  const tAmenities = useTranslations("roomDetail.amenities");
  const locale = useLocale();

  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Extract room type key from nameKey (e.g., "roomTypes.superior.name" -> "superior")
  const getRoomTypeKey = (nameKey: string) => {
    const parts = nameKey.split(".");
    return parts[1] || "";
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
            {t("steps.roomsTitle")}
          </h2>
          <p className="text-text-light text-sm">
            {t("availableFor", { nights })}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const typeKey = getRoomTypeKey(room.roomName);
          return (
            <div
              key={room.roomId}
              className="border border-border rounded-xl overflow-hidden hover:border-accent/50
                         hover:shadow-medium transition-all duration-300 bg-surface-bright"
            >
              <div className="flex flex-col md:flex-row">
                {/* Room Image */}
                <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                  <img
                    src={room.images[0]?.src || ""}
                    alt={typeKey ? tRooms(`${typeKey}.name`) : "Room"}
                    className="w-full h-full object-cover"
                  />
                  {room.available <= 3 && (
                    <span className="absolute top-3 left-3 bg-error text-white text-xs px-2 py-1 rounded">
                      {t("onlyLeft", { count: room.available })}
                    </span>
                  )}
                </div>

                {/* Room Details */}
                <div className="flex-1 p-4 md:p-6 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-heading text-primary mb-1">
                      {typeKey ? tRooms(`${typeKey}.name`) : room.roomSlug}
                    </h3>
                    <p className="text-text-light text-sm mb-3 line-clamp-2">
                      {typeKey ? tRooms(`${typeKey}.shortDesc`) : ""}
                    </p>

                    {/* Room specs */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      <span className="flex items-center gap-1 text-xs text-text-light">
                        <Users className="w-3.5 h-3.5" />
                        {room.maxGuests} {t("guestUnit")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-light">
                        <Maximize2 className="w-3.5 h-3.5" />
                        {room.size} m²
                      </span>
                    </div>

                    {/* Amenities preview */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {room.amenities.slice(0, 5).map((amenity) => (
                        <span
                          key={amenity}
                          className="flex items-center gap-1 text-xs bg-surface-dim px-2 py-1 rounded"
                        >
                          <Check className="w-3 h-3 text-success" />
                          {tAmenities(amenity)}
                        </span>
                      ))}
                      {room.amenities.length > 5 && (
                        <span className="text-xs text-text-light px-2 py-1">
                          +{room.amenities.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-end justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-2xl font-heading text-primary">
                        {formatPrice(room.totalPrice, locale)}
                      </p>
                      <p className="text-xs text-text-light">
                        {t("totalFor", { nights })}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelect(room)}
                      className="px-6 py-2.5 bg-accent text-primary-dark rounded-lg font-medium
                                 hover:bg-accent-light transition-all duration-300 text-sm"
                    >
                      {t("selectRoom")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
