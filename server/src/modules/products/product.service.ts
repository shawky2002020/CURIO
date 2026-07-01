import { Product, IProduct } from './product.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { Types } from 'mongoose';
import { Setting } from '../admin/setting.model.js';

interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  seller?: string;
  stockStatus?: 'in' | 'out' | 'low' | 'all';
  lowStockThreshold?: number;
}

export class ProductService {
  /**
   * Returns a paginated, filtered list of products.
   */
  public async getAll(filters: ProductFilters & { page?: number; limit?: number } = {}): Promise<any> {
    const query: Record<string, any> = {};

    // Always exclude soft-deleted items
    query.deletedAt = null;

    // Filter by status. 'all' is used by admins to fetch active, draft, and archived items.
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    } else if (!filters.status) {
      query.status = 'active';
    }

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

    if (filters.seller) {
      query.seller = new Types.ObjectId(filters.seller);
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    // Resolve low stock threshold
    let threshold = filters.lowStockThreshold;
    if (threshold === undefined) {
      const setting = await Setting.findOne({ key: 'lowStockThreshold' });
      threshold = setting ? Number(setting.value) : 5;
    }

    if (filters.stockStatus) {
      if (filters.stockStatus === 'out') {
        query.stock = 0;
      } else if (filters.stockStatus === 'low') {
        query.stock = { $gt: 0, $lte: threshold };
      } else if (filters.stockStatus === 'in') {
        query.stock = { $gt: threshold };
      }
    }

    // 1. Calculate statistics
    const statsQuery = { ...query };
    delete statsQuery.status;
    const statusCounts = await Product.aggregate([
      { $match: statsQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      total: 0,
      active: 0,
      draft: 0,
      archived: 0
    };

    statusCounts.forEach((sc) => {
      if (sc._id === 'active') stats.active = sc.count;
      else if (sc._id === 'draft') stats.draft = sc.count;
      else if (sc._id === 'archived') stats.archived = sc.count;
    });
    stats.total = stats.active + stats.draft + stats.archived;

    // 2. Perform query
    const page = filters.page ? Number(filters.page) : undefined;
    const limit = filters.limit ? Number(filters.limit) : 10;

    let productsQuery = Product.find(query)
      .populate('categoryId', 'name slug imageUrl')
      .populate('seller', 'fullName avatarUrl storeName storeDescription storeLogoUrl')
      .sort({ createdAt: -1 });

    if (page !== undefined) {
      const skip = (page - 1) * limit;
      productsQuery = productsQuery.skip(skip).limit(limit);
    }

    const products = await productsQuery;

    const mappedProducts = products.map(product => {
      const discount = product.discount || 0;
      const price = product.price;
      const effectivePrice = Math.round(price * (1 - discount / 100) * 100) / 100;
      
      let stockStatus: 'in' | 'low' | 'out' = 'in';
      if (product.stock === 0) {
        stockStatus = 'out';
      } else if (product.stock <= threshold!) {
        stockStatus = 'low';
      }

      const productJson = product.toJSON();
      productJson.effectivePrice = effectivePrice;
      productJson.stockStatus = stockStatus;
      return productJson as any;
    });

    if (page !== undefined) {
      const total = await Product.countDocuments(query);
      const pages = Math.ceil(total / limit);
      return {
        products: mappedProducts,
        total,
        pages,
        page,
        limit,
        stats
      };
    }

    return mappedProducts;
  }

  /**
   * Returns a single product by ID.
   */
  public async getById(id: string): Promise<IProduct> {
    const product = await Product.findById(id)
      .populate('categoryId', 'name slug imageUrl')
      .populate('seller', 'fullName avatarUrl storeName storeDescription storeLogoUrl');
    if (!product || product.deletedAt !== null) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    const setting = await Setting.findOne({ key: 'lowStockThreshold' });
    const threshold = setting ? Number(setting.value) : 5;

    const discount = product.discount || 0;
    const price = product.price;
    const effectivePrice = Math.round(price * (1 - discount / 100) * 100) / 100;
    
    let stockStatus: 'in' | 'low' | 'out' = 'in';
    if (product.stock === 0) {
      stockStatus = 'out';
    } else if (product.stock <= threshold) {
      stockStatus = 'low';
    }

    const productJson = product.toJSON();
    productJson.effectivePrice = effectivePrice;
    productJson.stockStatus = stockStatus;
    return productJson as any;
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
      discount?: number;
    }
  ): Promise<IProduct> {
    const slug = this.generateSlug(data.name) + '-' + Date.now();

    const product = await Product.create({
      ...data,
      slug,
      seller: new Types.ObjectId(sellerId),
      categoryId: new Types.ObjectId(data.categoryId),
    });

    const populated = await product.populate([
      { path: 'categoryId', select: 'name slug imageUrl' },
      { path: 'seller', select: 'fullName avatarUrl email role storeName storeDescription storeLogoUrl' }
    ]);

    const setting = await Setting.findOne({ key: 'lowStockThreshold' });
    const threshold = setting ? Number(setting.value) : 5;

    const discount = populated.discount || 0;
    const price = populated.price;
    const effectivePrice = Math.round(price * (1 - discount / 100) * 100) / 100;

    let stockStatus: 'in' | 'low' | 'out' = 'in';
    if (populated.stock === 0) {
      stockStatus = 'out';
    } else if (populated.stock <= threshold) {
      stockStatus = 'low';
    }

    const productJson = populated.toJSON();
    productJson.effectivePrice = effectivePrice;
    productJson.stockStatus = stockStatus;
    return productJson as any;
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
      discount: number;
    }>
  ): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product || product.deletedAt !== null) {
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
    if (data.status !== undefined) {
      product.status = data.status as any;
      // If status is updated by the seller to draft/active, reset the admin archive flag
      if (userRole === 'seller' && (data.status === 'draft' || data.status === 'active')) {
        (product as any).archivedByAdmin = false;
      }
    }
    if (data.discount !== undefined) product.discount = data.discount;
    if ((data as any).archivedByAdmin !== undefined) {
      (product as any).archivedByAdmin = (data as any).archivedByAdmin;
    }

    await product.save();
    
    const populated = await product.populate([
      { path: 'categoryId', select: 'name slug imageUrl' },
      { path: 'seller', select: 'fullName avatarUrl email role storeName storeDescription storeLogoUrl' }
    ]);

    const setting = await Setting.findOne({ key: 'lowStockThreshold' });
    const threshold = setting ? Number(setting.value) : 5;

    const discount = populated.discount || 0;
    const price = populated.price;
    const effectivePrice = Math.round(price * (1 - discount / 100) * 100) / 100;

    let stockStatus: 'in' | 'low' | 'out' = 'in';
    if (populated.stock === 0) {
      stockStatus = 'out';
    } else if (populated.stock <= threshold) {
      stockStatus = 'low';
    }

    const productJson = populated.toJSON();
    productJson.effectivePrice = effectivePrice;
    productJson.stockStatus = stockStatus;
    return productJson as any;
  }

  /**
   * Deletes a product. Sellers can only delete their own.
   */
  public async delete(id: string, userId: string, userRole: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product || product.deletedAt !== null) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    if (userRole === 'seller' && product.seller.toString() !== userId) {
      throw new ApiError(403, 'You do not have permission to delete this product.', 'FORBIDDEN');
    }

    product.deletedAt = new Date();
    product.status = 'archived';
    await product.save();
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
