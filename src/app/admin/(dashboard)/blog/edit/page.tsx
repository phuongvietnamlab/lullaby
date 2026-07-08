"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BilingualEditor, type BilingualContent } from "@/components/admin/bilingual-editor";

type Category = { id: string; name: string };

export default function BlogEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");

  const [categories, setCategories] = useState<Category[]>([]);
  const [initialData, setInitialData] = useState<Partial<BilingualContent> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/admin/blog/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories);
        }
      } catch {
        // Categories are optional - continue without them
        setCategories([]);
      }
    }
    fetchCategories();
  }, []);

  // Fetch existing post if editing
  useEffect(() => {
    async function fetchPost() {
      if (!postId) {
        setInitialData({});
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/admin/blog?id=${postId}`);
        if (res.ok) {
          const data = await res.json();
          const post = data.posts?.find(
            (p: { id: string }) => p.id === postId
          );
          if (post) {
            setInitialData({
              title: post.title,
              titleEn: post.titleEn || "",
              content: post.content,
              contentEn: post.contentEn || "",
              excerpt: post.excerpt || "",
              excerptEn: post.excerptEn || "",
              slug: post.slug,
              coverImage: post.coverImage || "",
              categoryId: post.categoryId || "",
              isPublished: post.isPublished,
              scheduledAt: post.scheduledAt
                ? new Date(post.scheduledAt).toISOString().slice(0, 16)
                : "",
            });
          }
        }
      } catch {
        setError("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  const handleSave = useCallback(
    async (data: BilingualContent) => {
      setIsSaving(true);
      setError(null);

      try {
        // TODO: Get actual authorId from session
        const authorId = "admin-1";

        const payload = {
          ...data,
          ...(postId ? { id: postId } : { authorId }),
        };

        const res = await fetch("/api/admin/blog", {
          method: postId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to save post");
        }

        router.push("/admin/blog");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save post");
      } finally {
        setIsSaving(false);
      }
    },
    [postId, router]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/blog")}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Back to blog list"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {postId ? "Edit Post" : "New Blog Post"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {postId
              ? "Update your blog post content"
              : "Create a new bilingual blog post"}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Editor */}
      {initialData !== null && (
        <BilingualEditor
          initialData={initialData}
          categories={categories}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
