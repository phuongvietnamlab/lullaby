"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, BedDouble } from "lucide-react";
import { mockRoomTypes, mockRooms } from "@/lib/admin/mock-data";

type Tab = "types" | "rooms";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminRoomsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("types");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage room types and individual rooms
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
          <Plus size={16} />
          {activeTab === "types" ? "Add Room Type" : "Add Room"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("types")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "types"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Room Types ({mockRoomTypes.length})
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "rooms"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Individual Rooms ({mockRooms.length})
          </button>
        </div>
      </div>

      {/* Room Types Tab */}
      {activeTab === "types" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Price/Night</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Max Guests</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Rooms</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockRoomTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                          <BedDouble size={16} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.name}</p>
                          <p className="text-xs text-gray-500">{type.view} view • {type.bedType} bed</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{formatPrice(type.price)}</td>
                    <td className="py-3 px-4 text-gray-600">{type.size}m²</td>
                    <td className="py-3 px-4 text-gray-600">{type.maxGuests}</td>
                    <td className="py-3 px-4 text-gray-600">{type.totalRooms}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        type.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {type.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
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
      )}

      {/* Individual Rooms Tab */}
      {activeTab === "rooms" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Room #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Floor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Last Cleaned</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{room.roomNumber}</td>
                    <td className="py-3 px-4 text-gray-600">{room.roomTypeName}</td>
                    <td className="py-3 px-4 text-gray-600">Floor {room.floor}</td>
                    <td className="py-3 px-4">
                      <RoomStatusBadge status={room.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(room.lastCleaned).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
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
      )}
    </div>
  );
}

function RoomStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    occupied: "bg-blue-100 text-blue-800",
    maintenance: "bg-red-100 text-red-800",
    cleaning: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
