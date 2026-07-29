"use client";

import { useState, useEffect } from "react";
import { Check, X, MessageSquare, Filter, Star, Undo2, RefreshCw } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  guestName: string;
  roomTypeName: string;
  photos: string[];
  response: string | null;
  rejectReason: string | null;
  status: string;
  createdAt: string;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Async IIFE so the initial load's setState is deferred (react-hooks/set-state-in-effect).
    void (async () => {
      await fetchReviews();
    })();
  }, []);

  // Shared PATCH helper for status / response mutations (D-11 — fetch only, no server action).
  const patchReview = async (
    id: string,
    body: Record<string, unknown>,
    successMessage: string
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback("error", data.error || "Failed to update review");
        return;
      }
      showFeedback("success", successMessage);
      await fetchReviews();
    } catch {
      showFeedback("error", "Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // MOD-02 — approve (free-form, allowed from any status, D-04)
  const handleApprove = (id: string) => {
    void patchReview(id, { status: "APPROVED" }, "Review approved");
  };

  // MOD-03 — reject with an OPTIONAL reason. Blank reason must succeed (D-02).
  const handleReject = (id: string) => {
    // window.prompt: null => cancelled/abort; "" => valid blank reason (D-02).
    const reason = window.prompt(
      "Optional reason for rejection (leave blank to reject without a reason):",
      ""
    );
    if (reason === null) return; // aborted
    void patchReview(
      id,
      { status: "REJECTED", rejectReason: reason },
      "Review rejected"
    );
  };

  // D-04 — pull a review back to pending from any status.
  const handleMoveToPending = (id: string) => {
    void patchReview(id, { status: "PENDING" }, "Review moved to pending");
  };

  // MOD-04 — write / edit / clear a public response (D-08, editable & clearable).
  const handleRespond = (id: string, current: string | null) => {
    const response = window.prompt(
      "Public response (leave blank to clear):",
      current ?? ""
    );
    if (response === null) return; // aborted
    void patchReview(
      id,
      { response },
      response === "" ? "Response cleared" : "Response saved"
    );
  };

  // MOD-05 — remove a single photo with a lightweight confirm (D-07).
  const handleRemovePhoto = async (id: string, photoUrl: string) => {
    const confirmed = window.confirm("Remove this photo? This cannot be undone.");
    if (!confirmed) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback("error", data.error || "Failed to remove photo");
        return;
      }
      // Optimistic local update — remove the URL from that review's photos.
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, photos: (data.photos as string[]) ?? r.photos.filter((u) => u !== photoUrl) }
            : r
        )
      );
      showFeedback("success", "Photo removed");
    } catch {
      showFeedback("error", "Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews =
    statusFilter === "all"
      ? reviews
      : reviews.filter((r) => r.status === statusFilter);

  // Stat computations (D-10) — all derived from real fetched data.
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const averageRating =
    approvedReviews.length === 0
      ? 0
      : Math.round(
          (approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
            approvedReviews.length) *
            10
        ) / 10;
  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = approvedReviews.length;
  const withResponseCount = approvedReviews.filter((r) => r.response).length;
  const responseRate =
    approvedCount === 0
      ? 0
      : Math.round((withResponseCount / approvedCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Moderate guest reviews and respond to feedback
          </p>
        </div>
        <button
          onClick={() => void fetchReviews()}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Average Rating</p>
          <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-1">
            {averageRating} <Star size={16} className="text-yellow-500" fill="currentColor" />
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending Moderation</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-sm text-gray-500">Response Rate</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{responseRate}%</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              statusFilter === status
                ? "bg-slate-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          Loading reviews...
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const busy = actionLoading === review.id;
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <ReviewStatusBadge status={review.status} />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={
                                i < review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          by {review.guestName} • {review.roomTypeName} •{" "}
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">{review.comment}</p>

                      {review.response && (
                        <div className="mt-3 pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded-r">
                          <p className="text-xs font-medium text-blue-700">Hotel Response:</p>
                          <p className="text-sm text-blue-800 mt-1">{review.response}</p>
                        </div>
                      )}

                      {review.status === "rejected" && review.rejectReason && (
                        <div className="mt-3 pl-4 border-l-2 border-red-200 bg-red-50 p-3 rounded-r">
                          <p className="text-xs font-medium text-red-700">
                            Rejection reason (internal):
                          </p>
                          <p className="text-sm text-red-800 mt-1">{review.rejectReason}</p>
                        </div>
                      )}

                      {/* Photos (MOD-05) */}
                      {review.photos.length > 0 ? (
                        <div className="flex flex-wrap gap-3 mt-4">
                          {review.photos.map((url) => (
                            <div key={url} className="relative group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt="Review photo"
                                className="w-20 h-20 object-cover rounded-md border border-gray-200"
                              />
                              <button
                                onClick={() => handleRemovePhoto(review.id, url)}
                                disabled={busy}
                                title="Remove photo"
                                className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-red-600 hover:border-red-300 shadow-sm disabled:opacity-50"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-3">No photos</p>
                      )}
                    </div>

                    {/* Actions — free-form re-moderation (D-04); Respond allowed on any status (D-09) */}
                    <div className="flex items-center gap-1 ml-4">
                      {review.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={busy}
                          title="Approve"
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {review.status !== "rejected" && (
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={busy}
                          title="Reject"
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          <X size={18} />
                        </button>
                      )}
                      {review.status !== "pending" && (
                        <button
                          onClick={() => handleMoveToPending(review.id)}
                          disabled={busy}
                          title="Move to pending"
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded disabled:opacity-50"
                        >
                          <Undo2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleRespond(review.id, review.response)}
                        disabled={busy}
                        title={review.response ? "Edit response" : "Respond"}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredReviews.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No reviews found with this filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
