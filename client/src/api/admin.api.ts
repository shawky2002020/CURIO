import { http } from './http.js';
import type { ApiResponse } from '../types/api.types.js';
import type { Product } from '../types/product.types.js';

export interface DashboardStats {
  customers: number;
  sellers: number;
  products: number;
  orders: number;
  revenue: number;
}

export interface MonthlyDataPoint {
  month: string;
  year: number;
  value: number;
}

export interface CategoryDataPoint {
  category: string;
  count: number;
}

export interface DashboardCharts {
  salesPerMonth: MonthlyDataPoint[];
  ordersPerMonth: MonthlyDataPoint[];
  productsPerCategory: CategoryDataPoint[];
}

export interface RecentOrder {
  _id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface RecentSeller {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface RecentProduct {
  _id: string;
  name: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface DashboardRecent {
  orders: RecentOrder[];
  sellers: RecentSeller[];
  products: RecentProduct[];
}

export interface DashboardData {
  stats: DashboardStats;
  charts: DashboardCharts;
  recent: DashboardRecent;
}

export interface UserRegistryItem {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'seller' | 'admin';
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
}

export interface PaginatedUsersData {
  users: UserRegistryItem[];
  total: number;
  pages: number;
  page: number;
  stats?: {
    totalCustomers: number;
    activeCustomers: number;
    totalSellers: number;
    activeSellers: number;
  };
}

export interface SellerRegistryItem {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked' | 'deleted';
  createdAt: string;
  productsCount: number;
  storeName?: string;
  storeDescription?: string;
}

export interface PaginatedSellersData {
  sellers: SellerRegistryItem[];
  total: number;
  pages: number;
  page: number;
  stats?: {
    totalCustomers: number;
    activeCustomers: number;
    totalSellers: number;
    activeSellers: number;
  };
}

export interface OrderItem {
  productId: {
    _id: string;
    name: string;
    images?: string[];
    seller?: {
      _id: string;
      fullName: string;
    };
  };
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderRegistryItem {
  _id: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  guestId?: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  promoCode?: string;
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  stripeSessionId?: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'card' | 'cash';
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRegistryItem {
  _id: string;
  rating: number;
  comment: string;
  sellerReply?: string;
  status: 'active' | 'hidden';
  createdAt: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  };
  product: {
    _id: string;
    name: string;
    slug: string;
  };
}

export interface PaginatedReviewsData {
  reviews: ReviewRegistryItem[];
  total: number;
  pages: number;
  page: number;
}

export interface CouponRegistryItem {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCouponsData {
  coupons: CouponRegistryItem[];
  total: number;
  pages: number;
  page: number;
}

export interface BannerRegistryItem {
  _id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBannersData {
  banners: BannerRegistryItem[];
  total: number;
  pages: number;
  page: number;
}

export interface PlatformSettings {
  taxRate: number;
  freeShippingThreshold: number;
  shippingCost: number;
  contactEmail: string;
  lowStockThreshold: number;
}

export const adminApi = {
  async fetchAllProducts(params?: {
    search?: string;
    categoryId?: string;
    status?: string;
    stockStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const response = await http.get<ApiResponse<any>>('/admin/products', { params });
    return response.data;
  },

  async archiveProduct(id: string): Promise<ApiResponse<Product>> {
    const response = await http.patch<ApiResponse<Product>>(`/admin/products/${id}/archive`);
    return response.data;
  },

  async fetchDashboardData(): Promise<ApiResponse<DashboardData>> {
    const response = await http.get<ApiResponse<DashboardData>>('/admin/dashboard');
    return response.data;
  },

  async fetchUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedUsersData>> {
    const response = await http.get<ApiResponse<PaginatedUsersData>>('/admin/users', { params });
    return response.data;
  },

  async fetchSellers(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedSellersData>> {
    const response = await http.get<ApiResponse<PaginatedSellersData>>('/admin/sellers', { params });
    return response.data;
  },

  async updateUser(
    id: string,
    payload: {
      fullName?: string;
      email?: string;
      phone?: string;
      role?: 'customer' | 'seller' | 'admin';
      status?: 'active' | 'blocked' | 'deleted';
    }
  ): Promise<ApiResponse<UserRegistryItem>> {
    const response = await http.patch<ApiResponse<UserRegistryItem>>(`/admin/users/${id}`, payload);
    return response.data;
  },

  async fetchOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const response = await http.get<ApiResponse<any>>('/orders', { params });
    return response.data;
  },

  async updateOrderStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  ): Promise<ApiResponse<OrderRegistryItem>> {
    const response = await http.patch<ApiResponse<OrderRegistryItem>>(`/orders/${id}/status`, { status });
    return response.data;
  },

  async fetchReviews(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedReviewsData>> {
    const response = await http.get<ApiResponse<PaginatedReviewsData>>('/admin/reviews', { params });
    return response.data;
  },

  async updateReview(
    id: string,
    payload: { status: 'active' | 'hidden' }
  ): Promise<ApiResponse<ReviewRegistryItem>> {
    const response = await http.patch<ApiResponse<ReviewRegistryItem>>(`/admin/reviews/${id}`, payload);
    return response.data;
  },

  async deleteReview(id: string): Promise<ApiResponse<null>> {
    const response = await http.delete<ApiResponse<null>>(`/admin/reviews/${id}`);
    return response.data;
  },

  async fetchCoupons(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedCouponsData>> {
    const response = await http.get<ApiResponse<PaginatedCouponsData>>('/admin/coupons', { params });
    return response.data;
  },

  async createCoupon(payload: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive?: boolean;
    usageLimit?: number;
    expirationDate?: string;
  }): Promise<ApiResponse<CouponRegistryItem>> {
    const response = await http.post<ApiResponse<CouponRegistryItem>>('/admin/coupons', payload);
    return response.data;
  },

  async updateCoupon(
    id: string,
    payload: {
      code?: string;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      isActive?: boolean;
      usageLimit?: number;
      expirationDate?: string | null;
    }
  ): Promise<ApiResponse<CouponRegistryItem>> {
    const response = await http.patch<ApiResponse<CouponRegistryItem>>(`/admin/coupons/${id}`, payload);
    return response.data;
  },

  async deleteCoupon(id: string): Promise<ApiResponse<null>> {
    const response = await http.delete<ApiResponse<null>>(`/admin/coupons/${id}`);
    return response.data;
  },

  async fetchBanners(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedBannersData>> {
    const response = await http.get<ApiResponse<PaginatedBannersData>>('/admin/banners', { params });
    return response.data;
  },

  async createBanner(payload: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    status?: 'active' | 'inactive';
  }): Promise<ApiResponse<BannerRegistryItem>> {
    const response = await http.post<ApiResponse<BannerRegistryItem>>('/admin/banners', payload);
    return response.data;
  },

  async updateBanner(
    id: string,
    payload: {
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      linkUrl?: string;
      status?: 'active' | 'inactive';
    }
  ): Promise<ApiResponse<BannerRegistryItem>> {
    const response = await http.patch<ApiResponse<BannerRegistryItem>>(`/admin/banners/${id}`, payload);
    return response.data;
  },

  async deleteBanner(id: string): Promise<ApiResponse<null>> {
    const response = await http.delete<ApiResponse<null>>(`/admin/banners/${id}`);
    return response.data;
  },

  async fetchSettings(): Promise<ApiResponse<PlatformSettings>> {
    const response = await http.get<ApiResponse<PlatformSettings>>('/admin/settings');
    return response.data;
  },

  async updateSettings(payload: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
    const response = await http.patch<ApiResponse<PlatformSettings>>('/admin/settings', payload);
    return response.data;
  },
};

export default adminApi;
