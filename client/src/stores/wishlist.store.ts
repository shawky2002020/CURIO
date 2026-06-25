import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Wishlist } from '../types/wishlist.types.js';
import { wishlistApi } from '../api/wishlist.api.js';

export const useWishlistStore = defineStore('wishlist', () => {
  const wishlist = ref<Wishlist | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchWishlist = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await wishlistApi.getWishlist();
      if (response.success && response.data) {
        wishlist.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch wishlist';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const addToWishlist = async (productId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await wishlistApi.addToWishlist(productId);
      if (response.success && response.data) {
        wishlist.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to add to wishlist';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await wishlistApi.removeFromWishlist(productId);
      if (response.success && response.data) {
        wishlist.value = response.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to remove from wishlist';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    wishlist,
    loading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
  };
});
export default useWishlistStore;
