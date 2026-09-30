"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, Plus, X, Loader2, UploadCloud, ImageIcon } from "lucide-react";
import Link from "next/link";
import { uploadImage } from "@/lib/upload";

type RoomTypeData = {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  basePrice: string;
  maxGuests: string;
  bedType: string;
  size: string;
  images: string[];
  amenities: string[];
  isActive: boolean;
  sortOrder: string;
};

const emptyRoom: RoomTypeData = {
  id: "",
  name: "",
  nameEn: "",
  slug: "",
  description: "",
  descriptionEn: "",
  basePrice: "",
  maxGuests: "2",
  bedType: "",
  size: "",
  images: [],
  amenities: [],
  isActive: true,
  sortOrder: "0",
};

export default function RoomTypeEditPage() {
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoomTypeData>(emptyRoom);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newAmenity, setNewAmenity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"vi" | "en">("vi");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draggingImages, setDraggingImages] = useState(false);

  const fetchRoomTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rooms");
      const data = await res.json();
      if (data.roomTypes) {
        const mapped = data.roomTypes.map((rt: Record<string, unknown>) => ({
          id: rt.id as string,
          name: rt.name as string,
          nameEn: rt.nameEn as string,
          slug: rt.slug as string,
          description: (rt.description as string) || "",
          descriptionEn: (rt.descriptionEn as string) || "",
          basePrice: String(rt.basePrice),
          maxGuests: String(rt.maxGuests),
          bedType: (rt.bedType as string) || "",
          size: rt.size ? String(rt.size) : "",
          images: (rt.images as string[]) || [],
          amenities: (rt.amenities as string[]) || [],
          isActive: rt.isActive as boolean,
          sortOrder: String(rt.sortOrder),
        }));
        setRoomTypes(mapped);
        if (mapped.length > 0 && !selectedId) {
          setSelectedId(mapped[0].id);
          setFormData(mapped[0]);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load room types" });
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  function selectRoomType(id: string) {
    const rt = roomTypes.find((r) => r.id === id);
    if (rt) {
      setSelectedId(id);
      setFormData(rt);
      setMessage(null);
    }
  }

  function updateField<K extends keyof RoomTypeData>(key: K, value: RoomTypeData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function addAmenity() {
    const trimmed = newAmenity.trim();
    if (trimmed && !formData.amenities.includes(trimmed)) {
      updateField("amenities", [...formData.amenities, trimmed]);
      setNewAmenity("");
    }
  }

  function removeAmenity(index: number) {
    updateField("amenities", formData.amenities.filter((_, i) => i !== index));
  }

  function addImage() {
    const trimmed = newImageUrl.trim();
    if (trimmed) {
      updateField("images", [...formData.images, trimmed]);
      setNewImageUrl("");
    }
  }

  function removeImage(index: number) {
    updateField("images", formData.images.filter((_, i) => i !== index));
  }

  async function uploadRoomImages(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imageFiles.length === 0) {
      setMessage({ type: "error", text: "Please choose image files to upload." });
      return;
    }

    setUploadingImages(true);
    setMessage(null);
    try {
      const urls = await Promise.all(
        imageFiles.map((file) => uploadImage(file, "rooms"))
      );
      updateField("images", [...formData.images, ...urls]);
      setMessage({
        type: "success",
        text: `${urls.length} room image${urls.length > 1 ? "s" : ""} uploaded.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Image upload failed",
      });
    } finally {
      setUploadingImages(false);
      setDraggingImages(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const isNew = !formData.id;
      const res = await fetch("/api/admin/rooms", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      } else {
        setMessage({ type: "success", text: isNew ? "Room type created!" : "Room type updated!" });
        await fetchRoomTypes();
        if (isNew && data.roomType) {
          setSelectedId(data.roomType.id);
        }
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  function startNewRoomType() {
    setSelectedId(null);
    setFormData(emptyRoom);
    setMessage(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/rooms"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Room Types</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage room type details, pricing, and amenities
            </p>
          </div>
        </div>
        <button
          onClick={startNewRoomType}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
        >
          <Plus size={16} />
          New Room Type
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Room Type List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Room Types ({roomTypes.length})
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {roomTypes.map((rt) => (
                <button
                  key={rt.id}
                  onClick={() => selectRoomType(rt.id)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    selectedId === rt.id
                      ? "bg-slate-50 text-slate-800 font-medium border-l-2 border-slate-800"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <p className="truncate">{rt.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {Number(rt.basePrice).toLocaleString("vi-VN")} VND
                  </p>
                </button>
              ))}
              {roomTypes.length === 0 && (
                <p className="px-3 py-4 text-sm text-gray-400 text-center">
                  No room types yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main: Edit Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Status message */}
            {message && (
              <div
                className={`px-4 py-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Bilingual Name & Description */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setActiveTab("vi")}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "vi"
                      ? "bg-white text-slate-800 border-b-2 border-slate-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🇻🇳 Tiếng Việt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("en")}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "en"
                      ? "bg-white text-slate-800 border-b-2 border-slate-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === "vi" ? "Tên loại phòng" : "Room Type Name"}
                  </label>
                  <input
                    type="text"
                    value={activeTab === "vi" ? formData.name : formData.nameEn}
                    onChange={(e) =>
                      updateField(activeTab === "vi" ? "name" : "nameEn", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder={activeTab === "vi" ? "VD: Phòng Superior Hướng Biển" : "e.g. Superior Sea View"}
                    required={activeTab === "vi"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === "vi" ? "Mô tả" : "Description"}
                  </label>
                  <textarea
                    value={activeTab === "vi" ? formData.description : formData.descriptionEn}
                    onChange={(e) =>
                      updateField(
                        activeTab === "vi" ? "description" : "descriptionEn",
                        e.target.value
                      )
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                    placeholder={
                      activeTab === "vi"
                        ? "Mô tả chi tiết về loại phòng..."
                        : "Detailed description of the room type..."
                    }
                  />
                </div>
              </div>
            </div>

            {/* Slug & Pricing */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Details & Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="superior-sea-view"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (VND)</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => updateField("basePrice", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="2200000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                  <input
                    type="text"
                    value={formData.bedType}
                    onChange={(e) => updateField("bedType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="King"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size (m²)</label>
                  <input
                    type="number"
                    value={formData.size}
                    onChange={(e) => updateField("size", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="32"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                  <input
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) => updateField("maxGuests", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => updateField("sortOrder", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Active (visible on public site)
                </label>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAmenity();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Add amenity (press Enter)"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Room Images</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Drag images here or paste a URL. These appear on the public room page.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {formData.images.length} image{formData.images.length === 1 ? "" : "s"}
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
                className={`mb-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
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
                    if (e.target.files?.length) {
                      uploadRoomImages(e.target.files);
                    }
                    e.currentTarget.value = "";
                  }}
                />
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  {uploadingImages ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <UploadCloud size={21} />
                  )}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {uploadingImages ? "Uploading images..." : "Drop room photos here"}
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  JPG, PNG, WebP or GIF, up to 5MB each
                </span>
              </label>

              {formData.images.length > 0 ? (
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {formData.images.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="group overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white opacity-0 shadow-sm transition-opacity hover:bg-black group-hover:opacity-100"
                          aria-label="Remove image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                          const updated = [...formData.images];
                          updated[idx] = e.target.value;
                          updateField("images", updated);
                        }}
                        className="w-full border-0 border-t border-gray-200 bg-white px-2 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
                  <ImageIcon className="mx-auto mb-2 text-gray-400" size={22} />
                  No room images yet.
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Paste image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="https://images.unsplash.com/..."
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                    aria-label="Add image URL"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving..." : formData.id ? "Update Room Type" : "Create Room Type"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
