"use client";

import { Plus, Edit, Trash2, Copy } from "lucide-react";
import { mockPromotions } from "@/lib/admin/mock-data";

function formatDiscount(type: string, value: number): string {
  if (type === "percentage") return `${value}%`;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminPromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount codes and special offers
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
          <Plus size={16} />
          New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active Promotions</p>
          <p className="text-xl font-bold text-green-600 mt-1">
            {mockPromotions.filter((p) => p.status === "active").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {mockPromotions.filter((p) => p.status === "scheduled").length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Usage This Month</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {mockPromotions.reduce((sum, p) => sum + p.usageCount, 0)}
          </p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Discount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Period</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Rooms</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Usage</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockPromotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{promo.name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {promo.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-green-700">
                    {formatDiscount(promo.discountType, promo.discountValue)} off
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {promo.startDate} → {promo.endDate}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {promo.applicableRooms.join(", ")}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {promo.usageCount}/{promo.maxUsage}
                  </td>
                  <td className="py-3 px-4">
                    <PromoStatusBadge status={promo.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Copy code">
                        <Copy size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={15} />
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

function PromoStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    scheduled: "bg-blue-100 text-blue-800",
    expired: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
