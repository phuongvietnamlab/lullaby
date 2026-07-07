"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Globe } from "lucide-react";
import { mockBlogPosts } from "@/lib/admin/mock-data";

type LocaleFilter = "all" | "en" | "vi";

export default function AdminBlogPage() {
  const [localeFilter, setLocaleFilter] = useState<LocaleFilter>("all");

  const filteredPosts =
    localeFilter === "all"
      ? mockBlogPosts
      : mockBlogPosts.filter((p) => p.locale === localeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage multi-locale blog content
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors">
          <Plus size={16} />
          New Post
        </button>
      </div>

      {/* Locale Filter */}
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-gray-400" />
        {(["all", "en", "vi"] as LocaleFilter[]).map((locale) => (
          <button
            key={locale}
            onClick={() => setLocaleFilter(locale)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              localeFilter === locale
                ? "bg-slate-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {locale === "all" ? "All" : locale === "en" ? "English" : "Tiếng Việt"}
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
                <th className="text-left py-3 px-4 font-medium text-gray-500">Locale</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Author</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Published</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{post.category}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      post.locale === "en" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                    }`}>
                      {post.locale.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{post.author}</td>
                  <td className="py-3 px-4">
                    <PostStatusBadge status={post.status} />
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Preview">
                        <Eye size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit size={15} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
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
  );
}

function PostStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
