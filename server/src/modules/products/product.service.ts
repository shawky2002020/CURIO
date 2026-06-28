import { Product, IProduct } from './product.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { Types } from 'mongoose';

interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

export class ProductService {
  /**
   * Returns a paginated, filtered list of products.
   */
  public async getAll(filters: ProductFilters = {}): Promise<IProduct[]> {
    const query: Record<string, any> = {};

    // Only show active products to the public unless status is explicitly set
    query.status = filters.status || 'active';

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    if (filters.categoryId) {
      query.categoryId = new Types.ObjectId(filters.categoryId);
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    return Product.find(query)
      .populate('categoryId', 'name slug imageUrl')
      .populate('seller', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
  }

  /**
   * Returns a single product by ID.
   */
  public async getById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('categoryId', 'name slug imageUrl')
      .populate('seller', 'fullName avatarUrl');
    if (!product) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }
    return product;
  }

  /**
   * Creates a new product.
   */
  public async create(
    sellerId: string,
    data: {
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      images?: string[];
      status?: string;
    }
  ): Promise<IProduct> {
    const slug = this.generateSlug(data.name) + '-' + Date.now();

    const product = await Product.create({
      ...data,
      slug,
      seller: new Types.ObjectId(sellerId),
      categoryId: new Types.ObjectId(data.categoryId),
    });

    return product.populate([
      { path: 'categoryId', select: 'name slug imageUrl' },
      { path: 'seller', select: 'fullName avatarUrl email role' }
    ]);
  }

  /**
   * Updates an existing product. Sellers can only update their own products (admin bypasses).
   */
  public async update(
    id: string,
    userId: string,
    userRole: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      images: string[];
      status: string;
    }>
  ): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    // Sellers can only edit their own products
    if (userRole === 'seller' && product.seller.toString() !== userId) {
      throw new ApiError(403, 'You do not have permission to edit this product.', 'FORBIDDEN');
    }

    if (data.name) {
      product.name = data.name;
      product.slug = this.generateSlug(data.name) + '-' + Date.now();
    }
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.stock !== undefined) product.stock = data.stock;
    if (data.categoryId) product.categoryId = new Types.ObjectId(data.categoryId);
    if (data.images !== undefined) product.images = data.images;
    if (data.status !== undefined) product.status = data.status as any;

    await product.save();
    return product.populate([
      { path: 'categoryId', select: 'name slug imageUrl' },
      { path: 'seller', select: 'fullName avatarUrl email role' }
    ]);
  }

  /**
   * Deletes a product. Sellers can only delete their own.
   */
  public async delete(id: string, userId: string, userRole: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    if (userRole === 'seller' && product.seller.toString() !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this product.', 'FORBIDDEN');
    }

    await product.deleteOne();
  }

  /**
   * Recalculates and persists the average rating and review count for a product.
   */
  public async recalculateRating(productId: string, ratings: number[]): Promise<void> {
    const reviewCount = ratings.length;
    const averageRating =
      reviewCount > 0 ? ratings.reduce((sum, r) => sum + r, 0) / reviewCount : 0;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount,
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}

export const productService = new ProductService();
export default productService;
