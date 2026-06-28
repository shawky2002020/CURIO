export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  categoryId: Category;
  images: string[];
  seller: {
    _id: string;
    fullName: string;
    avatarUrl?: string;
  };
  status: ProductStatus;
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
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: string[];
  status?: ProductStatus;
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
