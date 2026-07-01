import { http } from './http.js';
import type { ApiResponse } from '../types/api.types.js';
import type { Product, CreateProductPayload } from '../types/product.types.js';

export interface SellerProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
}

export const sellerProductsApi = {
  /**
   * GET /api/seller/products
   */
  async fetchSellerProducts(params?: {
    search?: string;
    categoryId?: string;
    status?: string;
    stockStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<SellerProductsResponse>> {
    const response = await http.get<ApiResponse<SellerProductsResponse>>('/seller/products', {
      params,
    });
    return response.data;
  },

  /**
   * POST /api/seller/products
   */
  async createProduct(data: CreateProductPayload): Promise<ApiResponse<Product>> {
    const response = await http.post<ApiResponse<Product>>('/seller/products', data);
    return response.data;
  },

  /**
   * PUT /api/seller/products/:id
   */
  async updateProduct(id: string, data: Partial<CreateProductPayload>): Promise<ApiResponse<Product>> {
    const response = await http.put<ApiResponse<Product>>(`/seller/products/${id}`, data);
    return response.data;
  },

  /**
   * PATCH /api/seller/products/:id/stock
   */
  async updateStock(id: string, stock: number): Promise<ApiResponse<{ _id: string; stock: number; stockStatus: 'in' | 'low' | 'out' }>> {
    const response = await http.patch<ApiResponse<{ _id: string; stock: number; stockStatus: 'in' | 'low' | 'out' }>>(
      `/seller/products/${id}/stock`,
      { stock }
    );
    return response.data;
  },

  /**
   * DELETE /api/seller/products/:id
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const response = await http.delete<ApiResponse<void>>(`/seller/products/${id}`);
    return response.data;
  },

  /**
   * POST /api/seller/products/:id/images
   */
  async uploadImages(id: string, files: File[]): Promise<ApiResponse<{ images: string[] }>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await http.post<ApiResponse<{ images: string[] }>>(
      `/seller/products/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

export default sellerProductsApi;
