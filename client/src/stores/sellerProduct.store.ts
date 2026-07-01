import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sellerProductsApi } from '../api/seller.products.api.js';
import { sellerApi } from '../api/seller.api.js';
import type { Product, CreateProductPayload } from '../types/product.types.js';

export const useSellerProductStore = defineStore('sellerProduct', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const filters = ref({
    search: '',
    categoryId: '',
    status: '',
    stockStatus: '',
  });

  const lowStockThreshold = ref(5);
  const stats = ref({
    total: 0,
    active: 0,
    draft: 0,
    archived: 0,
  });

  const fetchLowStockThreshold = async () => {
    try {
      const res = await sellerApi.fetchDashboardData();
      if (res.success && res.data && res.data.settings?.lowStockThreshold !== undefined) {
        lowStockThreshold.value = res.data.settings.lowStockThreshold;
      }
    } catch (err) {
      console.error('Failed to fetch low stock threshold, using default 5', err);
    }
  };

  const fetchProducts = async (page = 1) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await sellerProductsApi.fetchSellerProducts({
        ...filters.value,
        page,
        limit: pagination.value.limit,
      });
      if (res.success && res.data) {
        products.value = res.data.products;
        pagination.value = res.data.pagination;
        if (res.data.stats) {
          stats.value = res.data.stats;
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch seller products';
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (payload: CreateProductPayload) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await sellerProductsApi.createProduct(payload);
      if (res.success) {
        await fetchProducts(1);
      }
      return res;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProduct = async (id: string, payload: Partial<CreateProductPayload>) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await sellerProductsApi.updateProduct(id, payload);
      if (res.success) {
        await fetchProducts(pagination.value.page);
      }
      return res;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateStock = async (id: string, stock: number) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await sellerProductsApi.updateStock(id, stock);
      if (res.success) {
        // Update stock in local store array directly to avoid full page reload
        const index = products.value.findIndex((p) => p._id === id);
        if (index !== -1 && res.data) {
          products.value[index].stock = res.data.stock;
          products.value[index].stockStatus = res.data.stockStatus;
        }
      }
      return res;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update stock';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteProduct = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await sellerProductsApi.deleteProduct(id);
      products.value = products.value.filter((p) => p._id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const uploadImages = async (id: string, files: File[]) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await sellerProductsApi.uploadImages(id, files);
      if (res.success && res.data) {
        const index = products.value.findIndex((p) => p._id === id);
        if (index !== -1) {
          products.value[index].images = res.data.images;
        }
      }
      return res;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to upload images';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const resetFilters = () => {
    filters.value = {
      search: '',
      categoryId: '',
      status: '',
      stockStatus: '',
    };
  };

  return {
    products,
    loading,
    error,
    pagination,
    stats,
    filters,
    lowStockThreshold,
    fetchLowStockThreshold,
    fetchProducts,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    uploadImages,
    resetFilters,
  };
});
