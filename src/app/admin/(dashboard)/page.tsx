"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarDays,
  BedDouble,
  TrendingUp,
  Users,
  Clock,
  Star,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// ============================================
// Types
// ============================================

type RecentBooking = {
  id: string;
  bookingCode: string;
  guestName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
  createdAt: string;
};

type DashboardStats = {
  bookingsToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  pendingBookings: number;
  pendingReviews: number;
  averageRating: number;
  totalGuests: number;
  recentBookings: RecentBooking[];
  lastUpdated: string;
};

// ============================================
// Components
// ============================================

function StatCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtext && (
            <p className="text-xs text-gray-400 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    check_in: "bg-blue-100 text-blue-800",
    check_out: "bg-gray-100 text-gray-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
    expired: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-40 bg-gray-200 rounded" />
        <div className="h-4 w-60 bg-gray-100 rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded mt-2" />
            <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm h-40" />
        ))}
      </div>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-64" />
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// Page
// ============================================

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of hotel operations</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
          <p className="text-red-700 font-medium">Failed to load dashboard</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchDashboard()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const revenueChange = stats.revenueLastMonth > 0
    ? Math.round(((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of hotel operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {formatDateTime(stats.lastUpdated)}
          </span>
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Bookings Today"
          value={stats.bookingsToday}
          icon={<CalendarDays size={20} className="text-blue-600" />}
          color="bg-blue-50"
          subtext={`${stats.checkInsToday} check-ins, ${stats.checkOutsToday} check-outs`}
        />
        <StatCard
          label="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          icon={<BedDouble size={20} className="text-green-600" />}
          color="bg-green-50"
          subtext={`${stats.occupiedRooms}/${stats.totalRooms} rooms occupied`}
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(stats.revenueToday)}
          icon={<TrendingUp size={20} className="text-purple-600" />}
          color="bg-purple-50"
          subtext={`This month: ${formatCurrency(stats.revenueThisMonth)}`}
        />
        <StatCard
          label="Total Guests"
          value={stats.totalGuests}
          icon={<Users size={20} className="text-orange-600" />}
          color="bg-orange-50"
          subtext="Active guest profiles"
        />
      </div>

      {/* Quick Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <AlertCircle size={16} className="text-yellow-500" />
            Pending Actions
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Pending bookings</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.pendingBookings}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Reviews to moderate</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.pendingReviews}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Rooms in maintenance</span>
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.maintenanceRooms}
              </span>
            </div>
          </div>
        </div>

        {/* Room Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BedDouble size={16} className="text-blue-500" />
            Room Status
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Available</span>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.availableRooms}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Occupied</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.occupiedRooms}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Maintenance</span>
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {stats.maintenanceRooms}
              </span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            Performance
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Average rating</span>
              <span className="text-gray-900 font-medium">
                {stats.averageRating > 0 ? `${stats.averageRating}/5` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Revenue vs last month</span>
              <span className={`font-medium ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.revenueLastMonth > 0
                  ? `${revenueChange >= 0 ? "+" : ""}${revenueChange}%`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Last month revenue</span>
              <span className="text-gray-900 font-medium flex items-center gap-1">
                <Clock size={12} /> {formatCurrency(stats.revenueLastMonth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Recent Bookings</h3>
          <a href="/admin/bookings" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Guest</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Room</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentBookings.length > 0 ? (
                stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{booking.bookingCode}</td>
                    <td className="py-3 px-4">{booking.guestName}</td>
                    <td className="py-3 px-4 text-gray-600">{booking.roomTypeName}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
