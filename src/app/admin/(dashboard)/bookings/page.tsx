"use client";

import { useState, useEffect } from "react";
import { Check, X, Eye, Filter, RefreshCw, Calendar, User, Phone, Mail, MessageSquare } from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleUpdateStatus = async (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    if (status === "CANCELLED") {
      const confirmed = window.confirm("Are you sure you want to cancel this booking?");
      if (!confirmed) return;
    }

    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        showFeedback("error", data.error || "Failed to update booking");
        return;
      }

      showFeedback("success", `Booking ${status === "CONFIRMED" ? "confirmed" : "cancelled"} successfully`);
      fetchBookings();
    } catch {
      showFeedback("error", "Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

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

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

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
                        <button onClick={() => setSelectedBooking(booking)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View details">
                          <Eye size={15} />
                        </button>
                        {booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                              disabled={actionLoading === booking.id}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Confirm"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(booking.id, "CANCELLED")}
                              disabled={actionLoading === booking.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Cancel"
                            >
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Booking Code & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-gray-900">{selectedBooking.bookingCode}</span>
                <BookingStatusBadge status={selectedBooking.status} />
              </div>

              {/* Guest Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-gray-400" />
                    <span className="font-medium text-gray-900">{selectedBooking.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-600">{selectedBooking.guestEmail}</span>
                  </div>
                  {selectedBooking.guestPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-gray-400" />
                      <span className="text-gray-600">{selectedBooking.guestPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reservation</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Room</p>
                    <p className="font-medium text-gray-900">{selectedBooking.roomTypeName}</p>
                  </div>
                  {selectedBooking.roomNumber !== "-" && (
                    <div>
                      <p className="text-gray-500 text-xs">Room Number</p>
                      <p className="font-medium text-gray-900">{selectedBooking.roomNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 text-xs">Check-in</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      {selectedBooking.checkIn}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Check-out</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      {selectedBooking.checkOut}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Nights</p>
                    <p className="font-medium text-gray-900">{selectedBooking.nights}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total</p>
                    <p className="font-bold text-gray-900">{formatPrice(selectedBooking.totalPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <MessageSquare size={12} />
                    Special Requests
                  </h4>
                  <p className="text-sm text-amber-900">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Actions */}
              {selectedBooking.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { handleUpdateStatus(selectedBooking.id, "CONFIRMED"); setSelectedBooking(null); }}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => { handleUpdateStatus(selectedBooking.id, "CANCELLED"); setSelectedBooking(null); }}
                    className="flex-1 py-2.5 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
