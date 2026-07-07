"use client";

import { useState } from "react";
import { Plus, Trash2, Star, Filter } from "lucide-react";
import { mockGalleryImages } from "@/lib/admin/mock-data";

type CategoryFilter = "all" | "rooms" | "views" | "dining" | "spa" | "facilities" | "events";

export default function AdminGalleryPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filteredImages =
    categoryFilter === "all"
      ? mockGalleryImages
      : mockGalleryImages.filter((img) => img.category === categoryFilter);

  const categories: CategoryFilter[] = ["all", "rooms", "views", "dining", "spa", "facilities", "events"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and organize hotel images
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
          <Plus size={16} />
          Upload Images
        </button>
      </div>

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Image */}
            <div className="aspect-[4/3] bg-gray-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button className="p-2 bg-white rounded-full text-gray-700 hover:text-yellow-600 shadow" title="Toggle featured">
                  <Star size={16} />
                </button>
                <button className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 shadow" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
              {/* Featured badge */}
              {image.featured && (
                <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  Featured
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-xs font-medium text-gray-900 truncate">{image.alt}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500 capitalize">{image.category}</span>
                <span className="text-xs text-gray-400">{image.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No images in this category.</p>
        </div>
      )}
    </div>
  );
}
