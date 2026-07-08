"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Clock, History } from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  excerpt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  scheduledAt: string | null;
  status: "draft" | "scheduled" | "published";
  createdAt: string;
  author: { id: string; name: string; email: string };
  category: { id: string; name: string; nameEn: string | null; slug: string } | null;
};

export default function AdminBlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/admin/blog");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
        }
      } catch {
        // handle silently
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const filteredPosts =
    statusFilter === "all"
      ? posts
      : posts.filter((p) => p.status === statusFilter);

  async function handleDelete(postId: string) {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/blog?id=${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch {
      // handle silently
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage blog content with draft/publish workflow
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/blog/edit")}
          className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        {(["all", "draft", "scheduled", "published"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === status
                ? "bg-slate-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({posts.filter((p) => p.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Blog Posts Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Author</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No posts found
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                        {post.excerpt && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {post.category?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{post.author.name}</td>
                    <td className="py-3 px-4">
                      <PostStatusBadge status={post.status} scheduledAt={post.scheduledAt} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/blog/preview?id=${post.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/blog/history?id=${post.id}`)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="Revision History"
                        >
                          <History size={15} />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/blog/edit?id=${post.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PostStatusBadge({ status, scheduledAt }: { status: string; scheduledAt: string | null }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    scheduled: "bg-blue-100 text-blue-800",
    published: "bg-green-100 text-green-800",
  };

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status === "scheduled" && <Clock size={10} className="inline mr-0.5" />}
        {status}
      </span>
      {status === "scheduled" && scheduledAt && (
        <span className="text-xs text-gray-400">
          {new Date(scheduledAt).toLocaleDateString()}
        </span>
      )}
    </span>
  );
}
