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
};

export default sellerApi;
