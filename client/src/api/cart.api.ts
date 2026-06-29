import { http } from './http.js';

export interface CartItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
    stock: number;
    images: string[];
    status: string;
    slug: string;
  };
  quantity: number;
}

export interface CartData {
  _id: string;
  userId?: string;
  guestId?: string;
  items: CartItem[];
  promoCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface CartApiResponse {
  success: boolean;
  message: string;
  data: {
    cart: CartData;
    totals: CartTotals;
  };
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface OrderData {
  _id: string;
  userId?: string;
  guestId?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  promoCode?: string;
  totals: CartTotals;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface OrderApiResponse {
  success: boolean;
  message: string;
  data: OrderData;
}

export interface CheckoutApiResponse {
  success: boolean;
  message: string;
  data: {
    order: OrderData;
    checkoutUrl?: string;
  };
}

export interface OrdersHistoryApiResponse {
  success: boolean;
  message: string;
  data: OrderData[];
}

export const cartApi = {
  getCart: async (): Promise<CartApiResponse> => {
    const response = await http.get('/cart');
    return response.data;
  },

  addItem: async (productId: string, quantity: number): Promise<CartApiResponse> => {
    const response = await http.post('/cart/items', { productId, quantity });
    return response.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<CartApiResponse> => {
    const response = await http.patch(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: string): Promise<CartApiResponse> => {
    const response = await http.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async (): Promise<CartApiResponse> => {
    const response = await http.delete('/cart');
    return response.data;
  },

  applyPromo: async (code: string): Promise<CartApiResponse> => {
    const response = await http.post('/cart/promo', { code });
    return response.data;
  },

  removePromo: async (): Promise<CartApiResponse> => {
    const response = await http.delete('/cart/promo');
    return response.data;
  },

  checkout: async (shippingAddress: ShippingAddress): Promise<CheckoutApiResponse> => {
    const response = await http.post('/checkout', shippingAddress);
    return response.data;
  },

  getOrderById: async (orderId: string): Promise<OrderApiResponse> => {
    const response = await http.get(`/orders/${orderId}`);
    return response.data;
  },

  verifyPayment: async (orderId: string, sessionId: string): Promise<OrderApiResponse> => {
    const response = await http.post(`/orders/${orderId}/verify-payment`, { sessionId });
    return response.data;
  },

  getMyOrders: async (): Promise<OrdersHistoryApiResponse> => {
    const response = await http.get('/orders');
    return response.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<OrderApiResponse> => {
    const response = await http.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};

export default cartApi;
