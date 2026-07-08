"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw, Clock, FileText } from "lucide-react";

type Revision = {
  id: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  note: string | null;
};

type PostInfo = {
  id: string;
  title: string;
  slug: string;
};

export default function BlogHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const postId = searchParams.get("id");

  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [postInfo, setPostInfo] = useState<PostInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReverting, setIsReverting] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!postId) {
        setError("No post ID provided");
        setIsLoading(false);
        return;
      }

      try {
        // Fetch revisions
        const revRes = await fetch(
          `/api/admin/revisions?entityType=blog_post&entityId=${postId}`
        );
        if (revRes.ok) {
          const revData = await revRes.json();
          setRevisions(revData.revisions);
        }

        // Fetch post info
        const postRes = await fetch("/api/admin/blog");
        if (postRes.ok) {
          const postData = await postRes.json();
          const post = postData.posts?.find(
            (p: { id: string }) => p.id === postId
          );
          if (post) {
            setPostInfo({ id: post.id, title: post.title, slug: post.slug });
          }
        }
      } catch {
        setError("Failed to load revision history");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [postId]);

  async function handleRevert(revision: Revision) {
    if (!postId) return;

    const confirmed = window.confirm(
      "Are you sure you want to revert to this version? The current content will be saved as a new revision before reverting."
    );
    if (!confirmed) return;

    setIsReverting(revision.id);
    try {
      const data = revision.data as Record<string, unknown>;

      const res = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          title: data.title,
          titleEn: data.titleEn,
          content: data.content,
          contentEn: data.contentEn,
          excerpt: data.excerpt,
          excerptEn: data.excerptEn,
          slug: data.slug,
          coverImage: data.coverImage,
          categoryId: data.categoryId,
          isPublished: data.isPublished,
          scheduledAt: data.scheduledAt,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to revert");
      }

      // Refresh revisions
      const revRes = await fetch(
        `/api/admin/revisions?entityType=blog_post&entityId=${postId}`
      );
      if (revRes.ok) {
        const revData = await revRes.json();
        setRevisions(revData.revisions);
      }

      setSelectedRevision(null);
    } catch {
      setError("Failed to revert to this version");
    } finally {
      setIsReverting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (error && !revisions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push("/admin/blog")}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to blog list
        </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Revision History</h1>
          {postInfo && (
            <p className="text-sm text-gray-500 mt-0.5">
              {postInfo.title}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revisions List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock size={14} />
                Versions ({revisions.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {revisions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No revisions yet
                </div>
              ) : (
                revisions.map((rev, idx) => (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      selectedRevision?.id === rev.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        v{revisions.length - idx}
                      </span>
                      {idx === 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-1">
                      {rev.note || "Content updated"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(rev.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Revision Detail */}
        <div className="lg:col-span-2">
          {selectedRevision ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText size={14} />
                  Revision Detail
                </h2>
                {selectedRevision.id !== revisions[0]?.id && (
                  <button
                    onClick={() => handleRevert(selectedRevision)}
                    disabled={isReverting === selectedRevision.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw size={12} />
                    {isReverting === selectedRevision.id ? "Reverting..." : "Revert to this version"}
                  </button>
                )}
              </div>
              <div className="p-4 space-y-4">
                <RevisionContent data={selectedRevision.data} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 flex items-center justify-center py-20">
              <p className="text-sm text-gray-400">
                Select a revision to view its content
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RevisionContent({ data }: { data: Record<string, unknown> }) {
  const title = (data.title as string) || "";
  const titleEn = (data.titleEn as string) || "";
  const content = (data.content as string) || "";
  const excerpt = (data.excerpt as string) || "";

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Title (VI)
        </label>
        <p className="text-sm text-gray-900 mt-1">{title || "—"}</p>
      </div>
      {titleEn && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Title (EN)
          </label>
          <p className="text-sm text-gray-900 mt-1">{titleEn}</p>
        </div>
      )}

      {/* Excerpt */}
      {excerpt && (
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Excerpt
          </label>
          <p className="text-sm text-gray-600 mt-1">{excerpt}</p>
        </div>
      )}

      {/* Content Preview */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Content Preview
        </label>
        <div
          className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-100 prose prose-sm max-w-none max-h-80 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Slug
          </label>
          <p className="text-sm text-gray-700 mt-1 font-mono">
            {(data.slug as string) || "—"}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Status
          </label>
          <p className="text-sm text-gray-700 mt-1">
            {data.isPublished ? "Published" : data.scheduledAt ? "Scheduled" : "Draft"}
          </p>
        </div>
      </div>
    </div>
  );
}
