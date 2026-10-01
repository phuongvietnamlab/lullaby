"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, X, RefreshCw, UploadCloud, ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { uploadImage } from "@/lib/upload";

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
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  basePriceOverride: string;
  maxGuestsOverride: string;
  bedTypeOverride: string;
  sizeOverride: string;
  images: string[];
  amenities: string[];
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
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  basePriceOverride: string;
  maxGuestsOverride: string;
  bedTypeOverride: string;
  sizeOverride: string;
  images: string[];
  amenities: string[];
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
    name: "",
    nameEn: "",
    description: "",
    descriptionEn: "",
    basePriceOverride: "",
    maxGuestsOverride: "",
    bedTypeOverride: "",
    sizeOverride: "",
    images: [],
    amenities: [],
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
  const [activeTab, setActiveTab] = useState<Tab>("rooms");
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
          name: editing.name,
          nameEn: editing.nameEn,
          description: editing.description,
          descriptionEn: editing.descriptionEn,
          basePriceOverride: editing.basePriceOverride,
          maxGuestsOverride: editing.maxGuestsOverride,
          bedTypeOverride: editing.bedTypeOverride,
          sizeOverride: editing.sizeOverride,
          images: editing.images,
          amenities: editing.amenities,
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
          {activeTab === "rooms" ? (
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
          ) : (
            <Link
              href="/admin/rooms/edit"
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700"
            >
              <Plus size={16} />
              Add / Edit Room Type
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="cms-tabs">
        <div className="cms-tabs-list">
          <button
            onClick={() => setActiveTab("rooms")}
            className={`cms-tab ${activeTab === "rooms" ? "cms-tab-active" : ""}`}
          >
            Individual Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab("types")}
            className={`cms-tab ${activeTab === "types" ? "cms-tab-active" : ""}`}
          >
            Room Types ({roomTypes.length})
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
                                name: room.name,
                                nameEn: room.nameEn,
                                description: room.description,
                                descriptionEn: room.descriptionEn,
                                basePriceOverride: room.basePriceOverride,
                                maxGuestsOverride: room.maxGuestsOverride,
                                bedTypeOverride: room.bedTypeOverride,
                                sizeOverride: room.sizeOverride,
                                images: room.images,
                                amenities: room.amenities,
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
  const [newAmenity, setNewAmenity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draggingImages, setDraggingImages] = useState(false);
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500";

  const set = <K extends keyof RoomForm>(key: K, value: RoomForm[K]) =>
    onChange({ ...form, [key]: value });

  function addAmenity() {
    const trimmed = newAmenity.trim();
    if (!trimmed || form.amenities.includes(trimmed)) return;
    set("amenities", [...form.amenities, trimmed]);
    setNewAmenity("");
  }

  function removeAmenity(index: number) {
    set("amenities", form.amenities.filter((_, i) => i !== index));
  }

  function addImageUrl() {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    set("images", [...form.images, trimmed]);
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    set("images", form.images.filter((_, i) => i !== index));
  }

  async function uploadRoomImages(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const urls = await Promise.all(
        imageFiles.map((file) => uploadImage(file, "rooms"))
      );
      set("images", [...form.images, ...urls]);
    } finally {
      setUploadingImages(false);
      setDraggingImages(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
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

        <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-8rem)]">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display name (VI)
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="VD: Phòng 301 Hướng Biển"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display name (EN)
              </label>
              <input
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
                placeholder="e.g. Room 301 Sea View"
                className={inputClass}
              />
            </div>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price override
              </label>
              <input
                type="number"
                min={0}
                value={form.basePriceOverride}
                onChange={(e) => set("basePriceOverride", e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max guests
              </label>
              <input
                type="number"
                min={1}
                value={form.maxGuestsOverride}
                onChange={(e) => set("maxGuestsOverride", e.target.value)}
                placeholder="Default"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bed type
              </label>
              <input
                value={form.bedTypeOverride}
                onChange={(e) => set("bedTypeOverride", e.target.value)}
                placeholder="Optional override"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size (m²)
              </label>
              <input
                type="number"
                min={0}
                value={form.sizeOverride}
                onChange={(e) => set("sizeOverride", e.target.value)}
                placeholder="Optional override"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (VI)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (EN)
              </label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => set("descriptionEn", e.target.value)}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Room photos
              </label>
              <span className="text-xs text-gray-500">
                {form.images.length} image{form.images.length === 1 ? "" : "s"}
              </span>
            </div>
            <label
              onDragEnter={(e) => {
                e.preventDefault();
                setDraggingImages(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDraggingImages(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDraggingImages(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                uploadRoomImages(e.dataTransfer.files);
              }}
              className={`mb-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors ${
                draggingImages
                  ? "border-slate-700 bg-slate-50"
                  : "border-gray-300 bg-gray-50 hover:border-slate-400 hover:bg-white"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploadingImages}
                onChange={(e) => {
                  if (e.target.files?.length) uploadRoomImages(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
              <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                {uploadingImages ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <UploadCloud size={19} />
                )}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {uploadingImages ? "Uploading..." : "Drop room photos here"}
              </span>
              <span className="mt-1 text-xs text-gray-500">JPG, PNG, WebP or GIF up to 5MB</span>
            </label>

            {form.images.length > 0 ? (
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 shadow-sm transition-opacity hover:bg-black group-hover:opacity-100"
                        aria-label="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <input
                      value={url}
                      onChange={(e) => {
                        const next = [...form.images];
                        next[index] = e.target.value;
                        set("images", next);
                      }}
                      className="w-full border-0 border-t border-gray-200 bg-white px-2 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-500">
                <ImageIcon className="mx-auto mb-2 text-gray-400" size={20} />
                No room photos yet.
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImageUrl();
                  }
                }}
                placeholder="Paste image URL"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Add image URL"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room amenities
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
              {form.amenities.map((amenity, index) => (
                <span
                  key={`${amenity}-${index}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(index)}
                    className="text-slate-400 hover:text-red-500"
                    aria-label="Remove amenity"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder="Add amenity"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addAmenity}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                aria-label="Add amenity"
              >
                <Plus size={16} />
              </button>
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
