"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type AboutContent = {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  story: string;
  storyEn: string;
  mission: string;
  missionEn: string;
  vision: string;
  visionEn: string;
  values: { title: string; titleEn: string; description: string; descriptionEn: string }[];
  stats: { label: string; labelEn: string; value: string }[];
  teamImage: string;
  heroImage: string;
};

const defaultContent: AboutContent = {
  title: "Về Lullaby Sky Villa",
  titleEn: "About Lullaby Sky Villa",
  subtitle: "Nơi thiên nhiên và đẳng cấp hòa quyện",
  subtitleEn: "Where nature meets luxury",
  story: "Lullaby Sky Villa & Spa tọa lạc tại vị trí đắc địa nhất Vịnh Hạ Long, mang đến trải nghiệm nghỉ dưỡng đẳng cấp 5 sao với tầm nhìn toàn cảnh vịnh di sản.",
  storyEn: "Lullaby Sky Villa & Spa is located in the most prime location in Ha Long Bay, offering a 5-star luxury resort experience with panoramic views of the heritage bay.",
  mission: "Mang đến trải nghiệm nghỉ dưỡng đẳng cấp quốc tế, nơi mỗi khoảnh khắc đều trở thành kỷ niệm đáng nhớ.",
  missionEn: "To deliver world-class hospitality experiences where every moment becomes a cherished memory.",
  vision: "Trở thành điểm đến nghỉ dưỡng hàng đầu Đông Nam Á.",
  visionEn: "To become the leading luxury resort destination in Southeast Asia.",
  values: [
    {
      title: "Tận tâm",
      titleEn: "Dedication",
      description: "Phục vụ bằng cả trái tim",
      descriptionEn: "Service from the heart",
    },
    {
      title: "Tinh tế",
      titleEn: "Elegance",
      description: "Chú trọng từng chi tiết nhỏ",
      descriptionEn: "Attention to every detail",
    },
    {
      title: "Bền vững",
      titleEn: "Sustainability",
      description: "Phát triển hài hòa với thiên nhiên",
      descriptionEn: "Harmonious development with nature",
    },
  ],
  stats: [
    { label: "Năm hoạt động", labelEn: "Years of Operation", value: "5+" },
    { label: "Phòng nghỉ", labelEn: "Rooms", value: "120" },
    { label: "Nhân viên", labelEn: "Staff", value: "200+" },
    { label: "Đánh giá 5 sao", labelEn: "5-Star Reviews", value: "2000+" },
  ],
  teamImage: "",
  heroImage: "",
};

export default function ContentAboutPage() {
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"vi" | "en">("vi");

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content?key=about");
      const data = await res.json();
      if (data.config?.value) {
        setContent({ ...defaultContent, ...data.config.value });
      }
    } catch {
      // Use defaults
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
          key: "about",
          value: content,
          category: "pages",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save" });
      } else {
        setMessage({ type: "success", text: "About page content saved!" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  function updateValue(index: number, field: string, value: string) {
    const updated = [...content.values];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, values: updated }));
  }

  function updateStat(index: number, field: string, value: string) {
    const updated = [...content.stats];
    updated[index] = { ...updated[index], [field]: value };
    setContent((prev) => ({ ...prev, stats: updated }));
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
      <div className="flex items-center gap-3">
        <Link
          href="/admin/content"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Page Content</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Edit the about page story, mission, and values
          </p>
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

        {/* Hero */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Page Header</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Tiêu đề" : "Title"}
              </label>
              <input
                type="text"
                value={activeTab === "vi" ? content.title : content.titleEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "title" : "titleEn"]: e.target.value,
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
                value={activeTab === "vi" ? content.subtitle : content.subtitleEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "subtitle" : "subtitleEn"]: e.target.value,
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

        {/* Story */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {activeTab === "vi" ? "Câu chuyện" : "Our Story"}
          </h3>
          <textarea
            value={activeTab === "vi" ? content.story : content.storyEn}
            onChange={(e) =>
              setContent((prev) => ({
                ...prev,
                [activeTab === "vi" ? "story" : "storyEn"]: e.target.value,
              }))
            }
            rows={5}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Mission & Vision */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {activeTab === "vi" ? "Sứ mệnh & Tầm nhìn" : "Mission & Vision"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Sứ mệnh" : "Mission"}
              </label>
              <textarea
                value={activeTab === "vi" ? content.mission : content.missionEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "mission" : "missionEn"]: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === "vi" ? "Tầm nhìn" : "Vision"}
              </label>
              <textarea
                value={activeTab === "vi" ? content.vision : content.visionEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    [activeTab === "vi" ? "vision" : "visionEn"]: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {activeTab === "vi" ? "Giá trị cốt lõi" : "Core Values"}
          </h3>
          <div className="space-y-3">
            {content.values.map((val, idx) => (
              <div key={idx} className="p-3 border border-gray-100 rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {activeTab === "vi" ? "Tên" : "Title"}
                    </label>
                    <input
                      type="text"
                      value={activeTab === "vi" ? val.title : val.titleEn}
                      onChange={(e) =>
                        updateValue(idx, activeTab === "vi" ? "title" : "titleEn", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      {activeTab === "vi" ? "Mô tả" : "Description"}
                    </label>
                    <input
                      type="text"
                      value={activeTab === "vi" ? val.description : val.descriptionEn}
                      onChange={(e) =>
                        updateValue(
                          idx,
                          activeTab === "vi" ? "description" : "descriptionEn",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            {activeTab === "vi" ? "Số liệu nổi bật" : "Key Statistics"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 border border-gray-100 rounded-md bg-gray-50">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    {activeTab === "vi" ? "Nhãn" : "Label"}
                  </label>
                  <input
                    type="text"
                    value={activeTab === "vi" ? stat.label : stat.labelEn}
                    onChange={(e) =>
                      updateStat(idx, activeTab === "vi" ? "label" : "labelEn", e.target.value)
                    }
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Value</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => updateStat(idx, "value", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
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
            {saving ? "Saving..." : "Save About Content"}
          </button>
        </div>
      </form>
    </div>
  );
}
