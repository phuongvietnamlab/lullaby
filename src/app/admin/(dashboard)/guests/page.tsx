"use client";

import { Eye, Mail } from "lucide-react";
import { mockGuests } from "@/lib/admin/mock-data";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminGuestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
        <p className="text-sm text-gray-500 mt-1">
          Guest profiles and booking history
        </p>
      </div>

      {/* Guest Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Guests</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{mockGuests.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Platinum VIP</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {mockGuests.filter((g) => g.vipLevel === "platinum").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Gold VIP</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {mockGuests.filter((g) => g.vipLevel === "gold").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Returning Guests</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {mockGuests.filter((g) => g.totalStays > 1).length}
          </p>
        </div>
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total Stays</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Total Spent</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Last Visit</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">VIP Level</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{guest.name}</p>
                      <p className="text-xs text-gray-500">{guest.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{guest.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{guest.nationality}</td>
                  <td className="py-3 px-4 text-gray-600">{guest.totalStays}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(guest.totalSpent)}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{guest.lastVisit}</td>
                  <td className="py-3 px-4">
                    <VipBadge level={guest.vipLevel} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="View profile">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Send email">
                        <Mail size={15} />
                      </button>
                    </div>
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

function VipBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    platinum: "bg-purple-100 text-purple-800",
    gold: "bg-yellow-100 text-yellow-800",
    silver: "bg-gray-200 text-gray-700",
    regular: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[level] || "bg-gray-100 text-gray-600"}`}>
      {level}
    </span>
  );
}
