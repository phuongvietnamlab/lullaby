"use client";

import { useState, useEffect } from "react";
import { Check, X, Eye, Filter, RefreshCw } from "lucide-react";

type Booking = {
  id: string;
  bookingCode: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  specialRequests?: string;
};

type StatusFilter = "all" | "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "expired";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    checked_in: bookings.filter((b) => b.status === "checked_in").length,
    checked_out: bookings.filter((b) => b.status === "checked_out").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    expired: bookings.filter((b) => b.status === "expired").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reservations and guest stays
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {(["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled", "expired"] as StatusFilter[]).map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-slate-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status.replace("_", " ")} ({statusCounts[status]})
            </button>
          )
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-sm">
            Loading bookings...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Booking Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Check-in</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Check-out</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Nights</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{booking.bookingCode}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{booking.guestName}</p>
                        <p className="text-xs text-gray-500">{booking.guestEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-gray-900">{booking.roomTypeName}</p>
                        {booking.roomNumber !== "-" && (
                          <p className="text-xs text-gray-500">Room {booking.roomNumber}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{booking.checkIn}</td>
                    <td className="py-3 px-4 text-gray-600">{booking.checkOut}</td>
                    <td className="py-3 px-4 text-gray-600">{booking.nights}</td>
                    <td className="py-3 px-4 font-medium">{formatPrice(booking.totalPrice)}</td>
                    <td className="py-3 px-4">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View details">
                          <Eye size={15} />
                        </button>
                        {booking.status === "pending" && (
                          <>
                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Confirm">
                              <Check size={15} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Cancel">
                              <X size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredBookings.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No bookings found with this status.
          </div>
        )}
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    checked_in: "bg-blue-100 text-blue-800",
    checked_out: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-orange-100 text-orange-800",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
