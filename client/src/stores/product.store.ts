import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Product, ProductFilters, CreateProductPayload } from '../types/product.types.js';
import { productApi } from '../api/product.api.js';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const currentProduct = ref<Product | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<ProductFilters>({});

  const fetchProducts = async (productFilters?: ProductFilters) => {
    loading.value = true;
    error.value = null;
    if (productFilters !== undefined) filters.value = productFilters;
    try {
      const response = await productApi.getAll(filters.value);
      if (response.success && response.data) {
        products.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch products';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchProduct = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await productApi.getById(id);
      if (response.success && response.data) {
        currentProduct.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (payload: CreateProductPayload) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await productApi.create(payload);
      if (response.success && response.data) {
        products.value.unshift(response.data);
      }
      return response;
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
      const response = await productApi.update(id, payload);
      if (response.success && response.data) {
        const idx = products.value.findIndex((p) => p._id === id);
        if (idx !== -1) products.value[idx] = response.data;
        if (currentProduct.value?._id === id) currentProduct.value = response.data;
      }
      return response;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteProduct = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await productApi.delete(id);
      products.value = products.value.filter((p) => p._id !== id);
      if (currentProduct.value?._id === id) currentProduct.value = null;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    currentProduct,
    loading,
    error,
    filters,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
  };
});

export default useProductStore;
