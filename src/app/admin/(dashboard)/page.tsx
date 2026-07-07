"use client";

import {
  CalendarDays,
  BedDouble,
  TrendingUp,
  Users,
  Clock,
  Star,
  AlertCircle,
} from "lucide-react";
import { mockDashboardStats } from "@/lib/admin/mock-data";

// TODO: Replace with real-time data from database
const stats = mockDashboardStats;

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of hotel operations
        </p>
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

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            Performance
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Average rating</span>
              <span className="text-gray-900 font-medium">{stats.averageRating}/5</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Revenue vs last month</span>
              <span className="text-green-600 font-medium">
                +{Math.round(((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Avg. stay duration</span>
              <span className="text-gray-900 font-medium flex items-center gap-1">
                <Clock size={12} /> 2.8 nights
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
              {[
                { code: "LULLABY-G7H8I9", guest: "Tanaka Yuki", room: "Premium Ocean Suite", dates: "Dec 24-28", status: "pending" },
                { code: "LULLABY-A1B2C3", guest: "John Smith", room: "Deluxe Bay View", dates: "Dec 22-25", status: "confirmed" },
                { code: "LULLABY-M4N5O6", guest: "Park Min-jun", room: "Presidential Suite", dates: "Dec 26-31", status: "confirmed" },
                { code: "LULLABY-D4E5F6", guest: "Nguyen Thi Lan", room: "Superior Sea View", dates: "Dec 21-23", status: "checked_in" },
              ].map((booking) => (
                <tr key={booking.code} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{booking.code}</td>
                  <td className="py-3 px-4">{booking.guest}</td>
                  <td className="py-3 px-4 text-gray-600">{booking.room}</td>
                  <td className="py-3 px-4 text-gray-600">{booking.dates}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    checked_in: "bg-blue-100 text-blue-800",
    checked_out: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
