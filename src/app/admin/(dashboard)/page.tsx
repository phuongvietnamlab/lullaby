"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  BedDouble,
  TrendingUp,
  Users,
  Clock,
  Star,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  Plus,
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
  subtext,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  tone?: "slate" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    slate: "bg-[#edf4e9] text-[#2f7d32]",
    emerald: "bg-[#e5f3e1] text-[#2f7d32]",
    amber: "bg-[#fbf0dd] text-[#a96716]",
    rose: "bg-[#f8e8e4] text-[#ad5142]",
  };

  return (
    <div className="admin-stat-card group">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-gray-950">{value}</p>
          {subtext && (
            <p className="mt-1 text-sm text-gray-500">{subtext}</p>
          )}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-full ${tones[tone]}`}>
          {icon}
        </div>
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      <div>
        <div className="h-8 w-40 bg-gray-200 rounded-xl" />
        <div className="h-4 w-60 bg-gray-100 rounded-xl mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="admin-card p-5">
            <div className="h-4 w-24 bg-gray-200 rounded-xl" />
            <div className="h-8 w-16 bg-gray-200 rounded-xl mt-2" />
            <div className="h-3 w-32 bg-gray-100 rounded-xl mt-2" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="admin-card h-40" />
        ))}
      </div>
      <div className="admin-card h-64" />
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
    const timer = window.setTimeout(() => {
      void fetchDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchDashboard]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-950">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of hotel operations</p>
        </div>
        <div className="rounded-3xl bg-red-50 border border-red-200 p-8 text-center">
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

  const greetingDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="admin-hero-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{greetingDate}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">Good afternoon, team.</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Here is the live picture of arrivals, rooms and guest activity at Hasana today.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:items-start">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="admin-secondary-action inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link href="/admin/bookings" className="admin-primary-action inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold">
            <Plus size={15} /> New booking
          </Link>
        </div>
      </div>

      <div className="admin-activity-strip">
        <div>
          <span className="admin-live-dot" />
          <p className="admin-kicker">Live operations</p>
          <p className="admin-activity-title">Hotel floor is open</p>
          <p className="admin-activity-copy">{stats.checkInsToday} arrivals and {stats.checkOutsToday} departures scheduled today</p>
        </div>
        <div className="admin-activity-metric">
          <span>Occupancy</span>
          <strong>{stats.occupancyRate}%</strong>
        </div>
        <div className="admin-activity-metric">
          <span>Available rooms</span>
          <strong>{stats.availableRooms}</strong>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Bookings Today"
          value={stats.bookingsToday}
          icon={<CalendarDays size={20} />}
          subtext={`${stats.checkInsToday} check-ins, ${stats.checkOutsToday} check-outs`}
          tone="slate"
        />
        <StatCard
          label="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          icon={<BedDouble size={20} />}
          subtext={`${stats.occupiedRooms}/${stats.totalRooms} rooms occupied`}
          tone="emerald"
        />
        <StatCard
          label="Revenue Today"
          value={formatCurrency(stats.revenueToday)}
          icon={<TrendingUp size={20} />}
          subtext={`This month: ${formatCurrency(stats.revenueThisMonth)}`}
          tone="amber"
        />
        <StatCard
          label="Total Guests"
          value={stats.totalGuests}
          icon={<Users size={20} />}
          subtext="Active guest profiles"
          tone="rose"
        />
      </div>

      {/* Quick Info Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        {/* Pending Actions */}
        <div className="admin-card p-5">
          <h3 className="admin-card-title">
            <AlertCircle size={17} className="text-amber-500" />
            Pending Actions
          </h3>
          <div className="mt-4 space-y-3">
            <div className="admin-info-row">
              <span className="text-gray-600">Pending bookings</span>
              <span className="admin-chip bg-amber-100 text-amber-800">
                {stats.pendingBookings}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="text-gray-600">Reviews to moderate</span>
              <span className="admin-chip bg-amber-100 text-amber-800">
                {stats.pendingReviews}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="text-gray-600">Rooms in maintenance</span>
              <span className="admin-chip bg-red-100 text-red-800">
                {stats.maintenanceRooms}
              </span>
            </div>
          </div>
        </div>

        {/* Room Status */}
        <div className="admin-card p-5">
          <h3 className="admin-card-title">
            <BedDouble size={17} className="text-emerald-600" />
            Room Status
          </h3>
          <div className="mt-4 space-y-3">
            <div className="admin-info-row">
              <span className="text-gray-600">Available</span>
              <span className="admin-chip bg-green-100 text-green-800">
                {stats.availableRooms}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="text-gray-600">Occupied</span>
              <span className="admin-chip bg-slate-100 text-slate-800">
                {stats.occupiedRooms}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="text-gray-600">Maintenance</span>
              <span className="admin-chip bg-red-100 text-red-800">
                {stats.maintenanceRooms}
              </span>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="admin-card p-5">
          <h3 className="admin-card-title">
            <Star size={17} className="text-amber-500" />
            Performance
          </h3>
          <div className="mt-4 space-y-3">
            <div className="admin-info-row">
              <span className="text-gray-600">Average rating</span>
              <span className="text-gray-900 font-medium">
                {stats.averageRating > 0 ? `${stats.averageRating}/5` : "N/A"}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="text-gray-600">Revenue vs last month</span>
              <span className={`font-medium ${revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                {stats.revenueLastMonth > 0
                  ? `${revenueChange >= 0 ? "+" : ""}${revenueChange}%`
                : "N/A"}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="text-gray-600">Last month revenue</span>
              <span className="text-gray-900 font-medium flex items-center gap-1">
                <Clock size={12} /> {formatCurrency(stats.revenueLastMonth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="admin-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-950">Recent Bookings</h3>
            <p className="text-xs text-gray-500">Latest reservations entering the property workflow.</p>
          </div>
          <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            View all <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Code</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Guest</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Room</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Dates</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentBookings.length > 0 ? (
                stats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-amber-50/40">
                    <td className="py-4 px-4 font-mono text-xs font-semibold text-gray-950">{booking.bookingCode}</td>
                    <td className="py-4 px-4 font-medium text-gray-950">{booking.guestName}</td>
                    <td className="py-3 px-4 text-gray-600">{booking.roomTypeName}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
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
