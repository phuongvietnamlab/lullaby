"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

type PostData = {
  id: string;
  title: string;
  titleEn: string | null;
  content: string;
  contentEn: string | null;
  excerpt: string | null;
  excerptEn: string | null;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  author: { id: string; name: string };
  category: { id: string; name: string; nameEn: string | null } | null;
  createdAt: string;
};

export default function BlogPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const postId = searchParams.get("id");

  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<"vi" | "en">("vi");

  useEffect(() => {
    async function fetchPost() {
      if (!postId) {
        setError("No post ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/preview/blog/${postId}`);
        if (!res.ok) {
          throw new Error("Post not found");
        }
        const data = await res.json();
        setPost(data.post);
      } catch {
        setError("Failed to load post preview");
      } finally {
        setIsLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading preview...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600">{error || "Post not found"}</p>
        <button
          onClick={() => router.push("/admin/blog")}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to blog list
        </button>
      </div>
    );
  }

  const title = locale === "en" && post.titleEn ? post.titleEn : post.title;
  const content = locale === "en" && post.contentEn ? post.contentEn : post.content;
  const excerpt = locale === "en" && post.excerptEn ? post.excerptEn : post.excerpt;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/blog")}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-sm font-medium text-gray-700">Preview Mode</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {post.isPublished ? "Published" : "Draft"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Locale Toggle */}
          <div className="flex border border-gray-200 rounded-md overflow-hidden text-xs">
            <button
              onClick={() => setLocale("vi")}
              className={`px-3 py-1.5 transition-colors ${
                locale === "vi" ? "bg-slate-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              VI
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-1.5 transition-colors ${
                locale === "en" ? "bg-slate-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              EN
            </button>
          </div>
          <button
            onClick={() => router.push(`/admin/blog/edit?id=${post.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ExternalLink size={12} />
            Edit
          </button>
        </div>
      </div>

      {/* Preview Content - Luxury Typography */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="w-full h-64 bg-gray-100 overflow-hidden">
            <img
              src={post.coverImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-8 py-12">
          {/* Category */}
          {post.category && (
            <p className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-4">
              {locale === "en" && post.category.nameEn ? post.category.nameEn : post.category.name}
            </p>
          )}

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-medium text-gray-900 leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
            <span>{post.author.name}</span>
            <span>·</span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Draft"}
            </span>
          </div>

          {/* Excerpt */}
          {excerpt && (
            <p
              className="text-lg text-gray-600 leading-relaxed mb-8 italic"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-medium prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-amber-700 prose-a:no-underline hover:prose-a:underline"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </div>
    </div>
  );
}
