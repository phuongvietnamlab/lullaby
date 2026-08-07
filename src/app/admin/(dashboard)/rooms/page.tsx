"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, X, RefreshCw } from "lucide-react";
import Link from "next/link";

type Tab = "types" | "rooms";

const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "MAINTENANCE",
  "OUT_OF_ORDER",
] as const;
type RoomStatus = (typeof ROOM_STATUSES)[number];

type RoomType = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  basePrice: string | number;
  maxGuests: number;
  bedType: string | null;
  size: number | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { rooms: number };
};

type Room = {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  notes: string;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeSlug: string;
};

type RoomForm = {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  floor: string;
  status: RoomStatus;
  notes: string;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function emptyRoomForm(roomTypeId: string): RoomForm {
  return {
    id: "",
    roomNumber: "",
    roomTypeId,
    floor: "1",
    status: "AVAILABLE",
    notes: "",
  };
}

/**
 * Plain fetch with no setState, so the mount effect below has nothing to call
 * synchronously (react-hooks/set-state-in-effect) and can cancel cleanly.
 */
async function fetchRoomData(): Promise<{
  roomTypes: RoomType[];
  rooms: Room[];
}> {
  const [typesRes, roomsRes] = await Promise.all([
    fetch("/api/admin/rooms"),
    fetch("/api/admin/rooms/units"),
  ]);

  if (!typesRes.ok || !roomsRes.ok) {
    const failed = !typesRes.ok ? typesRes : roomsRes;
    const data = await failed.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load rooms");
  }

  const [typesData, roomsData] = await Promise.all([
    typesRes.json(),
    roomsRes.json(),
  ]);
  return { roomTypes: typesData.roomTypes, rooms: roomsData.rooms };
}

export default function AdminRoomsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("types");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<RoomForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchRoomData()
      .then((data) => {
        if (cancelled) return;
        setRoomTypes(data.roomTypes);
        setRooms(data.rooms);
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
      const data = await fetchRoomData();
      setRoomTypes(data.roomTypes);
      setRooms(data.rooms);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const room of rooms) {
      counts[room.status] = (counts[room.status] || 0) + 1;
    }
    return counts;
  }, [rooms]);

  async function handleSaveRoom() {
    if (!editing) return;
    setSaving(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/rooms/units", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing.id ? { id: editing.id } : {}),
          roomNumber: editing.roomNumber,
          roomTypeId: editing.roomTypeId,
          floor: Number(editing.floor),
          status: editing.status,
          notes: editing.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Failed to save room");
        return;
      }

      setEditing(null);
      await load();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRoom(room: Room) {
    if (!window.confirm(`Delete room ${room.roomNumber}?`)) return;

    try {
      const res = await fetch(`/api/admin/rooms/units?id=${room.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete room");
        return;
      }
      await load();
    } catch {
      setError("Network error. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading rooms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage room types and individual rooms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          {activeTab === "types" ? (
            <Link
              href="/admin/rooms/edit"
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700"
            >
              <Plus size={16} />
              Manage Room Types
            </Link>
          ) : (
            <button
              onClick={() => {
                setFormError("");
                setEditing(emptyRoomForm(roomTypes[0]?.id || ""));
              }}
              disabled={roomTypes.length === 0}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus size={16} />
              Add Room
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

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
            Room Types ({roomTypes.length})
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "rooms"
                ? "border-slate-800 text-slate-800"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Individual Rooms ({rooms.length})
          </button>
        </div>
      </div>

      {activeTab === "types" ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Slug</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Base Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Max Guests</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Rooms</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roomTypes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      No room types yet.
                    </td>
                  </tr>
                )}
                {roomTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{type.name}</p>
                      <p className="text-xs text-gray-500">{type.nameEn}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs font-mono">
                      {type.slug}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatPrice(Number(type.basePrice))}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{type.maxGuests}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {type.size ? `${type.size} m²` : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {type._count?.rooms ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          type.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {type.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ROOM_STATUSES.map((status) => (
              <div
                key={status}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <p className="text-sm text-gray-500 capitalize">
                  {status.replace("_", " ").toLowerCase()}
                </p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {statusCounts[status] || 0}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Room</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Floor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Notes</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-500">
                        No rooms yet. Availability counts these, so add one per
                        bookable room.
                      </td>
                    </tr>
                  )}
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {room.roomNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {room.roomTypeName}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{room.floor}</td>
                      <td className="py-3 px-4">
                        <RoomStatusBadge status={room.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">
                        {room.notes || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setFormError("");
                              setEditing({
                                id: room.id,
                                roomNumber: room.roomNumber,
                                roomTypeId: room.roomTypeId,
                                floor: String(room.floor),
                                status: room.status,
                                notes: room.notes,
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
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
      )}

      {editing && (
        <RoomFormModal
          form={editing}
          roomTypes={roomTypes}
          saving={saving}
          error={formError}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
}

function RoomStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    OCCUPIED: "bg-blue-100 text-blue-800",
    MAINTENANCE: "bg-yellow-100 text-yellow-800",
    OUT_OF_ORDER: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ").toLowerCase()}
    </span>
  );
}

function RoomFormModal({
  form,
  roomTypes,
  saving,
  error,
  onChange,
  onCancel,
  onSave,
}: {
  form: RoomForm;
  roomTypes: RoomType[];
  saving: boolean;
  error: string;
  onChange: (form: RoomForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500";

  const set = <K extends keyof RoomForm>(key: K, value: RoomForm[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {form.id ? "Edit room" : "Add room"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room number
            </label>
            <input
              value={form.roomNumber}
              onChange={(e) => set("roomNumber", e.target.value)}
              placeholder="101"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room type
            </label>
            <select
              value={form.roomTypeId}
              onChange={(e) => set("roomTypeId", e.target.value)}
              className={inputClass}
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor
              </label>
              <input
                type="number"
                min={0}
                value={form.floor}
                onChange={(e) => set("floor", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as RoomStatus)}
                className={inputClass}
              >
                {ROOM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <p className="text-xs text-gray-500">
            Rooms set to <strong>Out of order</strong> are excluded from
            availability, so guests cannot book them.
          </p>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
