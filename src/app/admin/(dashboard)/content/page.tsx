"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, Globe } from "lucide-react";
import Link from "next/link";

type HomepageContent = {
  heroTitle: string;
  heroTitleEn: string;
  heroSubtitle: string;
  heroSubtitleEn: string;
  heroImage: string;
  featuresTitle: string;
  featuresTitleEn: string;
  features: { title: string; titleEn: string; description: string; descriptionEn: string; icon: string }[];
  ctaTitle: string;
  ctaTitleEn: string;
  ctaDescription: string;
  ctaDescriptionEn: string;
  ctaButtonText: string;
  ctaButtonTextEn: string;
};

const defaultContent: HomepageContent = {
  heroTitle: "Thiên đường nghỉ dưỡng giữa Vịnh Hạ Long",
  heroTitleEn: "A Paradise in Ha Long Bay",
  heroSubtitle: "Trải nghiệm kỳ nghỉ đẳng cấp với tầm nhìn toàn cảnh vịnh",
  heroSubtitleEn: "Experience luxury with panoramic bay views",
  heroImage: "",
  featuresTitle: "Tại sao chọn chúng tôi",
  featuresTitleEn: "Why Choose Us",
  features: [
    {
      title: "Tầm nhìn tuyệt đẹp",
      titleEn: "Stunning Views",
      description: "Ngắm toàn cảnh Vịnh Hạ Long từ mọi góc nhìn",
      descriptionEn: "Panoramic Ha Long Bay views from every angle",
      icon: "mountain",
    },
    {
      title: "Dịch vụ đẳng cấp",
      titleEn: "Premium Service",
      description: "Đội ngũ nhân viên chuyên nghiệp phục vụ 24/7",
      descriptionEn: "Professional staff available 24/7",
      icon: "star",
    },
    {
      title: "Ẩm thực tinh tế",
      titleEn: "Fine Dining",
      description: "Nhà hàng hải sản tươi sống và đặc sản địa phương",
      descriptionEn: "Fresh seafood and local delicacies",
      icon: "utensils",
    },
  ],
  ctaTitle: "Đặt phòng ngay hôm nay",
  ctaTitleEn: "Book Your Stay Today",
  ctaDescription: "Tận hưởng kỳ nghỉ đáng nhớ cùng gia đình và người thân",
  ctaDescriptionEn: "Enjoy an unforgettable vacation with family and loved ones",
  ctaButtonText: "Đặt phòng",
  ctaButtonTextEn: "Book Now",
};

export default function ContentHomePage() {
  const [content, setContent] = useState<HomepageContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"vi" | "en">("vi");

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content?key=homepage");
      const data = await res.json();
      if (data.config?.value) {
        setContent({ ...defaultContent, ...data.config.value });
      }
    } catch {
      // Use defaults if fetch fails
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "homepage",
          value: content,
          category: "pages",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save" });
      } else {
        setMessage({ type: "success", text: "Homepage content saved!" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  function updateFeature(index: number, field: string, value: string) {
    const updated = [...content.features];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, features: updated }));
  }

  function addFeature() {
    setContent((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { title: "", titleEn: "", description: "", descriptionEn: "", icon: "star" },
      ],
    }));
  }

  function removeFeature(index: number) {
    setContent((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Content</h1>
          <p className="text-sm text-gray-500 mt-1">
            Edit hero section, features, and call-to-action
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500">Bilingual</span>
        </div>
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
        </div>
      )}

      {/* Sub-navigation */}
      <div className="flex gap-3">
        <span className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-full">
          Homepage
        </span>
        <Link
          href="/admin/content/about"
          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
        >
          About Page
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Language tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("vi")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "vi"
                ? "text-slate-800 border-b-2 border-slate-800"
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
                ? "text-slate-800 border-b-2 border-slate-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🇬🇧 English
          </button>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Hero Section</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Tiêu đề chính" : "Hero Title"}
              </label>
              <input
                type="text"
                value={activeTab === "vi" ? content.heroTitle : content.heroTitleEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "heroTitle" : "heroTitleEn"]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Phụ đề" : "Subtitle"}
              </label>
              <input
                type="text"
                value={activeTab === "vi" ? content.heroSubtitle : content.heroSubtitleEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "heroSubtitle" : "heroSubtitleEn"]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
              <input
                type="text"
                value={content.heroImage}
                onChange={(e) => setContent((prev) => ({ ...prev, heroImage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              {activeTab === "vi" ? "Điểm nổi bật" : "Features"}
            </h3>
            <button
              type="button"
              onClick={addFeature}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              + Add Feature
            </button>
          </div>
          <div className="space-y-4">
            {content.features.map((feature, idx) => (
              <div key={idx} className="p-3 border border-gray-100 rounded-md bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Feature {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {activeTab === "vi" ? "Tiêu đề" : "Title"}
                    </label>
                    <input
                      type="text"
                      value={activeTab === "vi" ? feature.title : feature.titleEn}
                      onChange={(e) =>
                        updateFeature(idx, activeTab === "vi" ? "title" : "titleEn", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Icon</label>
                    <input
                      type="text"
                      value={feature.icon}
                      onChange={(e) => updateFeature(idx, "icon", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="mountain, star, utensils..."
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    {activeTab === "vi" ? "Mô tả" : "Description"}
                  </label>
                  <input
                    type="text"
                    value={activeTab === "vi" ? feature.description : feature.descriptionEn}
                    onChange={(e) =>
                      updateFeature(
                        idx,
                        activeTab === "vi" ? "description" : "descriptionEn",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Call to Action</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Tiêu đề CTA" : "CTA Title"}
              </label>
              <input
                type="text"
                value={activeTab === "vi" ? content.ctaTitle : content.ctaTitleEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "ctaTitle" : "ctaTitleEn"]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Mô tả CTA" : "CTA Description"}
              </label>
              <input
                type="text"
                value={activeTab === "vi" ? content.ctaDescription : content.ctaDescriptionEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "ctaDescription" : "ctaDescriptionEn"]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Nút CTA" : "CTA Button Text"}
              </label>
              <input
                type="text"
                value={activeTab === "vi" ? content.ctaButtonText : content.ctaButtonTextEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "ctaButtonText" : "ctaButtonTextEn"]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Homepage Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
