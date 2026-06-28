import type { Product } from './product.types.js';

export interface WishlistItem {
  productId: Product;
  addedAt: string;
}

export interface Wishlist {
  userId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}
