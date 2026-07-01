import { http } from './http.js';
import type { ApiResponse } from '../types/api.types.js';

export interface SellerDashboardStats {
  revenue: number;
  orders: number;
  products: number;
  lowStock: number;
}

export interface MonthlyDataPoint {
  month: string;
  year: number;
  value: number;
}

export interface SellerDashboardCharts {
  monthlySales: MonthlyDataPoint[];
  monthlyRevenue: MonthlyDataPoint[];
}

export interface RecentSellerOrder {
  _id: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  sellerSubtotal: number;
  createdAt: string;
}

export interface RecentReview {
  _id: string;
  productId: {
    _id: string;
    name: string;
  };
  userId: {
    _id: string;
    fullName: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SellerDashboardRecent {
  orders: RecentSellerOrder[];
  reviews: RecentReview[];
}

export interface SellerDashboardData {
  stats: SellerDashboardStats;
  charts: SellerDashboardCharts;
  recent: SellerDashboardRecent;
  settings?: {
    lowStockThreshold: number;
  };
}

export interface SellerReviewItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
  };
  userId: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
    email: string;
  };
  rating: number;
  comment: string;
  sellerReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerReviewsResponse {
  reviews: SellerReviewItem[];
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export const sellerApi = {
  /**
   * GET /api/seller/dashboard
   * Fetch aggregate performance indicators and recent events for active seller.
   */
  async fetchDashboardData(): Promise<ApiResponse<SellerDashboardData>> {
    const response = await http.get<ApiResponse<SellerDashboardData>>('/seller/dashboard');
    return response.data;
  },

  /**
   * GET /api/seller/reviews
   * Fetch reviews for products owned by active seller.
   */
  async fetchReviews(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<SellerReviewsResponse>> {
    const response = await http.get<ApiResponse<SellerReviewsResponse>>('/seller/reviews', { params });
    return response.data;
  },

  /**
   * POST /api/seller/reviews/:reviewId/reply
   * Submit or update a reply text to a specific review.
   */
  async replyToReview(reviewId: string, replyText: string): Promise<ApiResponse<SellerReviewItem>> {
    const response = await http.post<ApiResponse<SellerReviewItem>>(`/seller/reviews/${reviewId}/reply`, { replyText });
    return response.data;
  },
};

export default sellerApi;
