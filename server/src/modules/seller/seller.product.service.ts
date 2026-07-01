import { Product } from '../products/product.model.js';
import { Setting } from '../admin/setting.model.js';
import { productService } from '../products/product.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { Types } from 'mongoose';

export class SellerProductService {
  /**
   * List products belonging to a seller with filters and pagination.
   */
  public async getSellerProducts(
    sellerId: string,
    filters: {
      search?: string;
      categoryId?: string;
      status?: string;
      stockStatus?: string;
    } = {},
    page: number = 1,
    limit: number = 10
  ) {
    const query: Record<string, any> = {
      seller: new Types.ObjectId(sellerId),
      deletedAt: null,
    };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.categoryId) {
      query.categoryId = new Types.ObjectId(filters.categoryId);
    }

    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    // Resolve dynamic low stock threshold
    const setting = await Setting.findOne({ key: 'lowStockThreshold' });
    const threshold = setting ? Number(setting.value) : 5;

    if (filters.stockStatus && filters.stockStatus !== 'all') {
      if (filters.stockStatus === 'out') {
        query.stock = 0;
      } else if (filters.stockStatus === 'low') {
        query.stock = { $gt: 0, $lte: threshold };
      } else if (filters.stockStatus === 'in') {
        query.stock = { $gt: threshold };
      }
    }

    const total = await Product.countDocuments(query);
    const pages = Math.ceil(total / limit);

    // Calculate seller product statistics
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

    const products = await Product.find(query)
      .populate('categoryId', 'name slug imageUrl')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const mapped = products.map((product) => {
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
      return productJson;
    });

    return {
      products: mapped,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      stats,
    };
  }

  /**
   * Create a new seller product.
   */
  public async createProduct(
    sellerId: string,
    data: {
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      discount?: number;
      images?: string[];
      status?: string;
    }
  ) {
    if (data.status === 'active') {
      if (
        !data.name ||
        !data.description ||
        data.price === undefined ||
        !data.categoryId ||
        !data.images ||
        data.images.length === 0
      ) {
        throw new ApiError(400, 'Cannot publish: missing required fields', 'PUBLISH_GATE_FAILED');
      }
    }

    return productService.create(sellerId, data);
  }

  /**
   * Update all fields of an existing seller product with publish-gate checks.
   */
  public async updateProduct(
    id: string,
    sellerId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      stock: number;
      categoryId: string;
      discount: number;
      images: string[];
      status: string;
    }>
  ) {
    const product = await Product.findById(id);
    if (!product || product.deletedAt !== null) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    if (product.seller.toString() !== sellerId) {
      throw new ApiError(403, 'You do not have permission to edit this product.', 'FORBIDDEN');
    }

    // Publish-gate validation: check if publishing to active status
    if (data.status === 'active') {
      const mergedName = data.name !== undefined ? data.name : product.name;
      const mergedDesc = data.description !== undefined ? data.description : product.description;
      const mergedPrice = data.price !== undefined ? data.price : product.price;
      const mergedCategory = data.categoryId !== undefined ? data.categoryId : product.categoryId;
      const mergedImages = data.images !== undefined ? data.images : product.images;

      if (
        !mergedName ||
        !mergedDesc ||
        mergedPrice === undefined ||
        !mergedCategory ||
        !mergedImages ||
        mergedImages.length === 0
      ) {
        throw new ApiError(400, 'Cannot publish: missing required fields', 'PUBLISH_GATE_FAILED');
      }
    }

    return productService.update(id, sellerId, 'seller', data);
  }

  /**
   * Update stock only.
   */
  public async updateStock(id: string, sellerId: string, stock: number) {
    const product = await Product.findById(id);
    if (!product || product.deletedAt !== null) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    if (product.seller.toString() !== sellerId) {
      throw new ApiError(403, 'You do not have permission to edit this product.', 'FORBIDDEN');
    }

    if (stock < 0) {
      throw new ApiError(400, 'Stock cannot be negative.', 'VALIDATION_ERROR');
    }

    product.stock = stock;
    await product.save();

    const setting = await Setting.findOne({ key: 'lowStockThreshold' });
    const threshold = setting ? Number(setting.value) : 5;

    let stockStatus: 'in' | 'low' | 'out' = 'in';
    if (product.stock === 0) {
      stockStatus = 'out';
    } else if (product.stock <= threshold) {
      stockStatus = 'low';
    }

    return {
      _id: product._id.toString(),
      stock: product.stock,
      stockStatus,
    };
  }

  /**
   * Soft delete a product.
   */
  public async softDelete(id: string, sellerId: string) {
    return productService.delete(id, sellerId, 'seller');
  }

  /**
   * Upload and append images for a seller product.
   */
  public async uploadImages(id: string, sellerId: string, urls: string[]) {
    const product = await Product.findById(id);
    if (!product || product.deletedAt !== null) {
      throw new ApiError(404, 'Product not found.', 'NOT_FOUND');
    }

    if (product.seller.toString() !== sellerId) {
      throw new ApiError(403, 'You do not have permission to edit this product.', 'FORBIDDEN');
    }

    const currentImages = product.images || [];
    if (currentImages.length + urls.length > 5) {
      throw new ApiError(400, 'You can upload a maximum of 5 images per product.', 'TOO_MANY_FILES');
    }

    product.images = [...currentImages, ...urls];
    await product.save();

    return {
      images: product.images,
    };
  }
}

export const sellerProductService = new SellerProductService();
export default sellerProductService;
