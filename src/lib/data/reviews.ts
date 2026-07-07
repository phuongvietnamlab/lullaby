/**
 * Reviews data helpers
 * Provides approved guest reviews for public pages
 */

import { mockReviews, type ReviewAdmin } from "@/lib/admin/mock-data";

export type PublicReview = {
  id: string;
  guestName: string;
  rating: number;
  title: string;
  comment: string;
  roomTypeName: string;
  stayDate: string;
  response?: string;
  createdAt: string;
};

/**
 * Get all approved reviews for public display
 */
export function getApprovedReviews(): PublicReview[] {
  return mockReviews
    .filter((review) => review.status === "approved")
    .map((review) => ({
      id: review.id,
      guestName: review.guestName,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      roomTypeName: review.roomTypeName,
      stayDate: review.stayDate,
      response: review.response,
      createdAt: review.createdAt,
    }));
}

/**
 * Get the average rating from approved reviews
 */
export function getAverageRating(): { average: number; count: number } {
  const approved = mockReviews.filter((review) => review.status === "approved");
  if (approved.length === 0) return { average: 0, count: 0 };

  const total = approved.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / approved.length) * 10) / 10,
    count: approved.length,
  };
}
