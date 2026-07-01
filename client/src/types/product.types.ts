export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  status?: 'active' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount?: number;
  effectivePrice?: number;
  stock: number;
  stockStatus?: 'in' | 'low' | 'out';
  categoryId: Category;
  images: string[];
  seller: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
    storeName?: string;
    storeDescription?: string;
    storeLogoUrl?: string;
    storePhone?: string;
  };
  status: ProductStatus;
  deletedAt?: string | null;
  archivedByAdmin?: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
  };
  rating: number;
  comment: string;
  sellerReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  stockStatus?: 'in' | 'out' | 'low' | 'all';
  status?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  pages: number;
  page: number;
  limit: number;
  stats: {
    total: number;
    active: number;
    draft: number;
    archived: number;
  };
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: string[];
  status?: ProductStatus;
  discount?: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}
