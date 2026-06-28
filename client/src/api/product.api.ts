import { http } from './http.js';
import type { ApiResponse } from '../types/api.types.js';
import type {
  Category,
  Product,
  Review,
  ProductFilters,
  CreateProductPayload,
  CreateCategoryPayload,
  CreateReviewPayload,
} from '../types/product.types.js';

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoryApi = {
  async getAll(): Promise<ApiResponse<Category[]>> {
    const response = await http.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Category>> {
    const response = await http.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },

  async create(payload: CreateCategoryPayload): Promise<ApiResponse<Category>> {
    const response = await http.post<ApiResponse<Category>>('/categories', payload);
    return response.data;
  },

  async update(id: string, payload: Partial<CreateCategoryPayload>): Promise<ApiResponse<Category>> {
    const response = await http.put<ApiResponse<Category>>(`/categories/${id}`, payload);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await http.delete<ApiResponse<null>>(`/categories/${id}`);
    return response.data;
  },
};

// ─── Products ────────────────────────────────────────────────────────────────

export const productApi = {
  async getAll(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const response = await http.get<ApiResponse<Product[]>>('/products', { params: filters });
    return response.data;
  },

  async getById(id: string): Promise<ApiResponse<Product>> {
    const response = await http.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  async create(payload: CreateProductPayload): Promise<ApiResponse<Product>> {
    const response = await http.post<ApiResponse<Product>>('/products', payload);
    return response.data;
  },

  async update(id: string, payload: Partial<CreateProductPayload>): Promise<ApiResponse<Product>> {
    const response = await http.put<ApiResponse<Product>>(`/products/${id}`, payload);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await http.delete<ApiResponse<null>>(`/products/${id}`);
    return response.data;
  },
};

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviewApi = {
  async getByProduct(productId: string): Promise<ApiResponse<Review[]>> {
    const response = await http.get<ApiResponse<Review[]>>(`/products/${productId}/reviews`);
    return response.data;
  },

  async create(productId: string, payload: CreateReviewPayload): Promise<ApiResponse<Review>> {
    const response = await http.post<ApiResponse<Review>>(
      `/products/${productId}/reviews`,
      payload
    );
    return response.data;
  },

  async update(
    productId: string,
    reviewId: string,
    payload: Partial<CreateReviewPayload>
  ): Promise<ApiResponse<Review>> {
    const response = await http.put<ApiResponse<Review>>(
      `/products/${productId}/reviews/${reviewId}`,
      payload
    );
    return response.data;
  },

  async delete(productId: string, reviewId: string): Promise<ApiResponse<null>> {
    const response = await http.delete<ApiResponse<null>>(
      `/products/${productId}/reviews/${reviewId}`
    );
    return response.data;
  },
};

export default { categoryApi, productApi, reviewApi };
