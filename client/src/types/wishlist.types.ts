export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface Wishlist {
  userId: string;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
}
