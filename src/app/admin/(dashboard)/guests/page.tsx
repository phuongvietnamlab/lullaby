"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Search, RefreshCw, X } from "lucide-react";

type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  notes: string;
  totalBookings: number;
  totalStays: number;
  upcomingStays: number;
  totalSpent: number;
  lastVisit: string | null;
  vipLevel: "regular" | "silver" | "gold" | "platinum";
  createdAt: string;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Plain fetch with no setState, so the mount effect below has nothing to call
 * synchronously (react-hooks/set-state-in-effect) and can cancel cleanly.
 */
async function fetchGuests(): Promise<{ guests: Guest[] }> {
  const res = await fetch("/api/admin/guests");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load guests");
  }
  return res.json();
}

export default function AdminGuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Guest | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGuests()
      .then((data) => {
        if (!cancelled) setGuests(data.guests);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setGuests((await fetchGuests()).guests);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q)
    );
  }, [guests, query]);

  const stats = useMemo(
    () => ({
      total: guests.length,
      platinum: guests.filter((g) => g.vipLevel === "platinum").length,
      gold: guests.filter((g) => g.vipLevel === "gold").length,
      returning: guests.filter((g) => g.totalStays > 1).length,
    }),
    [guests]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading guests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Guest profiles and booking history
          </p>
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Guest Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Guests" value={stats.total} />
        <StatCard label="Platinum VIP" value={stats.platinum} />
        <StatCard label="Gold VIP" value={stats.gold} />
        <StatCard label="Returning Guests" value={stats.returning} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone"
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Guest</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nationality</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Stays</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Upcoming</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total Spent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Last Visit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">VIP Level</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-500">
                    {guests.length === 0
                      ? "No guests yet. They appear here once a booking is made."
                      : "No guests match that search."}
                  </td>
                </tr>
              )}
              {filtered.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{guest.name}</p>
                      <p className="text-xs text-gray-500">{guest.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {guest.phone || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {guest.nationality || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{guest.totalStays}</td>
                  <td className="py-3 px-4 text-gray-600">{guest.upcomingStays}</td>
                  <td className="py-3 px-4 font-medium">
                    {formatPrice(guest.totalSpent)}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {guest.lastVisit || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <VipBadge level={guest.vipLevel} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelected(guest)}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        View
                      </button>
                      <a
                        href={`mailto:${guest.email}`}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Send email"
                      >
                        <Mail size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <GuestDetail guest={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function GuestDetail({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">{guest.name}</h2>
            <p className="text-xs text-gray-500">{guest.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <dl className="p-4 space-y-2 text-sm">
          <Row label="Phone" value={guest.phone || "—"} />
          <Row label="Nationality" value={guest.nationality || "—"} />
          <Row label="Total bookings" value={String(guest.totalBookings)} />
          <Row label="Completed stays" value={String(guest.totalStays)} />
          <Row label="Upcoming stays" value={String(guest.upcomingStays)} />
          <Row label="Total spent" value={formatPrice(guest.totalSpent)} />
          <Row label="Last visit" value={guest.lastVisit || "—"} />
          <Row label="VIP level" value={guest.vipLevel} />
          <Row
            label="Guest since"
            value={new Date(guest.createdAt).toLocaleDateString("vi-VN")}
          />
          {guest.notes && <Row label="Notes" value={guest.notes} />}
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 text-right capitalize">{value}</dd>
    </div>
  );
}

function VipBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    platinum: "bg-purple-100 text-purple-800",
    gold: "bg-yellow-100 text-yellow-800",
    silver: "bg-gray-200 text-gray-700",
    regular: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[level] || "bg-gray-100 text-gray-600"
      }`}
    >
      {level}
    </span>
  );
}
