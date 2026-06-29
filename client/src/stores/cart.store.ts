import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { cartApi } from '../api/cart.api.js';
import type { CartData, CartTotals, ShippingAddress, OrderData } from '../api/cart.api.js';
import { useToastStore } from './toast.store.js';

export const useCartStore = defineStore('cart', () => {
  const toastStore = useToastStore();

  const cart = ref<CartData | null>(null);
  const totals = ref<CartTotals>({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    taxRate: 10,
    total: 0,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computes the total quantity of items in the cart
  const cartCount = computed(() => {
    if (!cart.value || !cart.value.items) return 0;
    return cart.value.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  const fetchCart = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await cartApi.getCart();
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch cart';
      console.error('Error fetching cart:', err);
    } finally {
      loading.value = false;
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await cartApi.addItem(productId, quantity);
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
        toastStore.success('Object added to cart registry.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to add item to cart';
      toastStore.error(msg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    // If quantity is 0, we can trigger removal locally or let API handle it.
    // The API removes the item if quantity is 0.
    error.value = null;
    try {
      const response = await cartApi.updateItem(itemId, quantity);
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
        if (quantity === 0) {
          toastStore.success('Item removed from cart.');
        } else {
          toastStore.success('Registry quantity adjusted.');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      toastStore.error(msg);
      throw err;
    }
  };

  const removeFromCart = async (itemId: string) => {
    error.value = null;
    try {
      const response = await cartApi.removeItem(itemId);
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
        toastStore.success('Item removed from cart.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove item';
      toastStore.error(msg);
      throw err;
    }
  };

  const clearCart = async () => {
    error.value = null;
    try {
      const response = await cartApi.clearCart();
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
        toastStore.success('Shopping cart registry cleared.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to clear cart';
      toastStore.error(msg);
      throw err;
    }
  };

  const applyPromo = async (code: string) => {
    error.value = null;
    try {
      const response = await cartApi.applyPromo(code);
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
        toastStore.success(`Promo code "${code.toUpperCase()}" applied.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid promo code';
      toastStore.error(msg);
      throw err;
    }
  };

  const removePromo = async () => {
    error.value = null;
    try {
      const response = await cartApi.removePromo();
      if (response.success && response.data) {
        cart.value = response.data.cart;
        totals.value = response.data.totals;
        toastStore.success('Promo code removed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to remove promo code';
      toastStore.error(msg);
      throw err;
    }
  };

  const checkout = async (
    shippingAddress: ShippingAddress,
    paymentMethod: 'card' | 'cash' = 'card'
  ): Promise<{ order: OrderData; checkoutUrl?: string }> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await cartApi.checkout({ shippingAddress, paymentMethod });
      if (response.success && response.data) {
        if (!response.data.checkoutUrl) {
          // Direct sandbox checkout, clear local cart state
          cart.value = null;
          totals.value = { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 };
          toastStore.success('Order processed successfully.');
        } else {
          toastStore.success('Redirecting to secure payment checkout...');
        }
        return response.data;
      }
      throw new Error(response.message || 'Checkout failed');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Checkout failed';
      toastStore.error(msg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    cart,
    totals,
    loading,
    error,
    cartCount,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromo,
    removePromo,
    checkout,
  };
});

export default useCartStore;
