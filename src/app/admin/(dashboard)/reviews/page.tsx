"use client";

import { useState, useEffect } from "react";
import { Filter, Star } from "lucide-react";

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

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/reviews");
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          Moderate guest reviews and respond to feedback
        </p>
      </div>

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
            {filteredReviews.map((review) => (
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
                  </div>

                  {/* Actions — wired in Task 2 */}
                  <div className="flex items-center gap-1 ml-4" />
                </div>

                {/* Photos — rendered/wired in Task 2 */}
              </div>
            ))}
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
