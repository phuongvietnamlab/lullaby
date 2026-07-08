"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Trash2, Filter, Save, X, Loader2, Edit2, Upload } from "lucide-react";
import { uploadImage } from "@/lib/upload";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
  altEn: string | null;
  category: string;
  sortOrder: number;
};

type CategoryFilter = "all" | "rooms" | "facilities" | "views" | "dining" | "spa" | "exterior";

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add form state
  const [newUrl, setNewUrl] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [newAltEn, setNewAltEn] = useState("");
  const [newCategory, setNewCategory] = useState("rooms");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editAlt, setEditAlt] = useState("");
  const [editAltEn, setEditAltEn] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");

  const categories: CategoryFilter[] = ["all", "rooms", "views", "dining", "spa", "facilities", "exterior"];

  const fetchImages = useCallback(async () => {
    try {
      const url = categoryFilter === "all"
        ? "/api/admin/gallery"
        : `/api/admin/gallery?category=${categoryFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load images" });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    setLoading(true);
    fetchImages();
  }, [fetchImages]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, "gallery");
      setNewUrl(url);
      setMessage({ type: "success", text: "Image uploaded! Fill in details and click Add." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Upload failed";
      setMessage({ type: "error", text: msg });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          alt: newAlt.trim() || null,
          altEn: newAltEn.trim() || null,
          category: newCategory,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Image added!" });
        setShowAddForm(false);
        setNewUrl("");
        setNewAlt("");
        setNewAltEn("");
        setNewCategory("rooms");
        await fetchImages();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to add image" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  async function handleUpdate(id: string) {
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          alt: editAlt,
          altEn: editAltEn,
          category: editCategory,
          sortOrder: editSortOrder,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Image updated!" });
        setEditingId(null);
        await fetchImages();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to update" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Image deleted" });
        await fetchImages();
      } else {
        setMessage({ type: "error", text: "Failed to delete" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  }

  function startEdit(image: GalleryImage) {
    setEditingId(image.id);
    setEditAlt(image.alt || "");
    setEditAltEn(image.altEn || "");
    setEditCategory(image.category);
    setEditSortOrder(String(image.sortOrder));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hotel images — add, edit captions, reorder
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Plus size={16} />
          Add Image
        </button>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right text-current opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add Image Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Add New Image</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Choose File
                    </>
                  )}
                </button>
                <span className="text-xs text-gray-500">Max 5MB. JPG, PNG, WebP, GIF</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload gallery image"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL <span className="text-gray-400 font-normal">(or paste URL directly)</span>
              </label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="Upload a file above or paste a URL here..."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption (VI)</label>
                <input
                  type="text"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Mô tả hình ảnh..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption (EN)</label>
                <input
                  type="text"
                  value={newAltEn}
                  onChange={(e) => setNewAltEn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="Image description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  <option value="rooms">Rooms</option>
                  <option value="views">Views</option>
                  <option value="dining">Dining</option>
                  <option value="spa">Spa</option>
                  <option value="facilities">Facilities</option>
                  <option value="exterior">Exterior</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-colors"
              >
                Add Image
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-gray-400" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              categoryFilter === cat
                ? "bg-slate-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt || ""}
                  className="w-full h-full object-cover"
                />
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(image)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 shadow"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 shadow"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Info or Edit Form */}
              {editingId === image.id ? (
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Caption (VI)"
                  />
                  <input
                    type="text"
                    value={editAltEn}
                    onChange={(e) => setEditAltEn(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                    placeholder="Caption (EN)"
                  />
                  <div className="flex gap-2">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="rooms">Rooms</option>
                      <option value="views">Views</option>
                      <option value="dining">Dining</option>
                      <option value="spa">Spa</option>
                      <option value="facilities">Facilities</option>
                      <option value="exterior">Exterior</option>
                    </select>
                    <input
                      type="number"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="Order"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(image.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700"
                    >
                      <Save size={12} />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {image.alt || image.altEn || "No caption"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 capitalize">{image.category}</span>
                    <span className="text-xs text-gray-400">#{image.sortOrder}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && images.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No images found. Add some to get started.</p>
        </div>
      )}
    </div>
  );
}
