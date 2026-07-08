"use client";

import { useState } from "react";
import { RichTextEditor } from "./rich-text-editor";
import { Eye, EyeOff } from "lucide-react";

export type BilingualContent = {
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  excerpt: string;
  excerptEn: string;
  slug: string;
  coverImage: string;
  categoryId: string;
  isPublished: boolean;
  scheduledAt: string;
};

type BilingualEditorProps = {
  initialData?: Partial<BilingualContent>;
  categories: { id: string; name: string }[];
  onSave: (data: BilingualContent) => Promise<void>;
  isSaving?: boolean;
};

type Tab = "vi" | "en";

export function BilingualEditor({
  initialData,
  categories,
  onSave,
  isSaving = false,
}: BilingualEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("vi");
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<BilingualContent>({
    title: initialData?.title ?? "",
    titleEn: initialData?.titleEn ?? "",
    content: initialData?.content ?? "",
    contentEn: initialData?.contentEn ?? "",
    excerpt: initialData?.excerpt ?? "",
    excerptEn: initialData?.excerptEn ?? "",
    slug: initialData?.slug ?? "",
    coverImage: initialData?.coverImage ?? "",
    categoryId: initialData?.categoryId ?? "",
    isPublished: initialData?.isPublished ?? false,
    scheduledAt: initialData?.scheduledAt ?? "",
  });

  function updateField<K extends keyof BilingualContent>(
    key: K,
    value: BilingualContent[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleTitleChange(value: string, locale: Tab) {
    if (locale === "vi") {
      updateField("title", value);
      if (!formData.slug) {
        updateField("slug", generateSlug(value));
      }
    } else {
      updateField("titleEn", value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? "Edit Mode" : "Preview"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => {
                updateField("isPublished", e.target.checked);
                if (e.target.checked) updateField("scheduledAt", "");
              }}
              className="rounded border-gray-300"
            />
            Publish immediately
          </label>
          {!formData.isPublished && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Schedule:</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => updateField("scheduledAt", e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : formData.scheduledAt ? "Schedule Post" : "Save Post"}
          </button>
        </div>
      </div>

      {/* Shared fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            placeholder="auto-generated-from-title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image URL
          </label>
          <input
            type="text"
            value={formData.coverImage}
            onChange={(e) => updateField("coverImage", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Language Tabs */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
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
          {showPreview ? (
            <PreviewPanel
              title={activeTab === "vi" ? formData.title : formData.titleEn}
              content={activeTab === "vi" ? formData.content : formData.contentEn}
            />
          ) : (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === "vi" ? "Tiêu đề" : "Title"}
                </label>
                <input
                  type="text"
                  value={activeTab === "vi" ? formData.title : formData.titleEn}
                  onChange={(e) => handleTitleChange(e.target.value, activeTab)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder={
                    activeTab === "vi" ? "Nhập tiêu đề..." : "Enter title..."
                  }
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === "vi" ? "Tóm tắt" : "Excerpt"}
                </label>
                <textarea
                  value={activeTab === "vi" ? formData.excerpt : formData.excerptEn}
                  onChange={(e) =>
                    updateField(
                      activeTab === "vi" ? "excerpt" : "excerptEn",
                      e.target.value
                    )
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
                  placeholder={
                    activeTab === "vi"
                      ? "Mô tả ngắn cho bài viết..."
                      : "Brief description..."
                  }
                />
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === "vi" ? "Nội dung" : "Content"}
                </label>
                {activeTab === "vi" ? (
                  <RichTextEditor
                    content={formData.content}
                    onChange={(html) => updateField("content", html)}
                    placeholder="Viết nội dung bài viết..."
                  />
                ) : (
                  <RichTextEditor
                    content={formData.contentEn}
                    onChange={(html) => updateField("contentEn", html)}
                    placeholder="Write your content here..."
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function PreviewPanel({ title, content }: { title: string; content: string }) {
  return (
    <div className="preview-content bg-surface rounded-lg p-8 min-h-[400px]">
      {title && (
        <h1
          className="text-3xl font-medium mb-6"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {title}
        </h1>
      )}
      {content ? (
        <div
          className="prose prose-lg max-w-none"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className="text-gray-400 italic">No content to preview</p>
      )}
    </div>
  );
}
