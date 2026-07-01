import { User } from '../users/user.model.js';
import { Product } from '../products/product.model.js';
import { Order } from '../cart/order.model.js';
import { Category } from '../products/category.model.js';
import { Review } from '../products/review.model.js';
import { PromoCode } from '../cart/promo.model.js';
import { Setting } from './setting.model.js';
import { productService } from '../products/product.service.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  DashboardStats,
  DashboardCharts,
  DashboardRecent,
  DashboardResponse,
  MonthlyDataPoint,
  CategoryDataPoint,
  RecentOrder,
  RecentSeller,
  RecentProduct,
} from './admin.types.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

class AdminService {
  /**
   * Fetch aggregate platform statistics.
   */
  public async getStats(): Promise<DashboardStats> {
    const [customers, sellers, products, orders, revenueResult] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } },
      ]),
    ]);

    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return { customers, sellers, products, orders, revenue };
  }

  /**
   * Fetch chart datasets for the last 12 months and category distribution.
   */
  public async getCharts(): Promise<DashboardCharts> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const [salesPipeline, ordersPipeline, categoryPipeline] = await Promise.all([
      // Sales per month (revenue)
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            value: { $sum: '$totals.total' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Orders per month (count)
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
            value: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Products per category
      Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryInfo',
          },
        },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$categoryId',
            category: { $first: '$categoryInfo.name' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const salesPerMonth: MonthlyDataPoint[] = salesPipeline.map((item: any) => ({
      month: MONTH_NAMES[item._id.month - 1],
      year: item._id.year,
      value: item.value,
    }));

    const ordersPerMonth: MonthlyDataPoint[] = ordersPipeline.map((item: any) => ({
      month: MONTH_NAMES[item._id.month - 1],
      year: item._id.year,
      value: item.value,
    }));

    const productsPerCategory: CategoryDataPoint[] = categoryPipeline.map((item: any) => ({
      category: item.category || 'Uncategorized',
      count: item.count,
    }));

    return { salesPerMonth, ordersPerMonth, productsPerCategory };
  }

  /**
   * Fetch the top 5 latest records for orders, sellers, and products.
   */
  public async getRecentItems(): Promise<DashboardRecent> {
    const [recentOrders, recentSellers, recentProducts] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      User.find({ role: 'seller' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName email createdAt')
        .lean(),

      Product.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name price status createdAt')
        .lean(),
    ]);

    const orders: RecentOrder[] = recentOrders.map((o: any) => ({
      _id: o._id.toString(),
      customerName: o.shippingAddress?.fullName || 'Guest',
      total: o.totals?.total || 0,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));

    const sellers: RecentSeller[] = recentSellers.map((s: any) => ({
      _id: s._id.toString(),
      fullName: s.fullName,
      email: s.email || '',
      createdAt: s.createdAt.toISOString(),
    }));

    const products: RecentProduct[] = recentProducts.map((p: any) => ({
      _id: p._id.toString(),
      name: p.name,
      price: p.price,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));

    return { orders, sellers, products };
  }

  /**
   * Compose the full dashboard response from all three data sections.
   */
  public async getDashboardData(): Promise<DashboardResponse> {
    const [stats, charts, recent] = await Promise.all([
      this.getStats(),
      this.getCharts(),
      this.getRecentItems(),
    ]);

    return { stats, charts, recent };
  }

  /**
   * Fetch a paginated, filterable list of user profiles.
   */
  public async getUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { search, role, status } = query;

    const filter: any = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (status) {
      filter.status = status;
    } else {
      // Exclude soft-deleted users by default
      filter.status = { $ne: 'deleted' };
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total, totalCustomers, activeCustomers, totalSellers, activeSellers] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-passwordHash')
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ role: 'customer', status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'customer', status: 'active' }),
      User.countDocuments({ role: 'seller', status: { $ne: 'deleted' } }),
      User.countDocuments({ role: 'seller', status: 'active' }),
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / limit),
      page,
      stats: {
        totalCustomers,
        activeCustomers,
        totalSellers,
        activeSellers,
      },
    };
  }

  /**
   * Update user details, role, status, or soft-delete profile.
   * Blocks self-modification.
   */
  public async updateUser(
    targetUserId: string,
    payload: {
      fullName?: string;
      email?: string;
      phone?: string;
      role?: 'customer' | 'seller' | 'admin';
      status?: 'active' | 'blocked' | 'deleted';
    },
    requesterUserId: string
  ) {
    if (targetUserId === requesterUserId) {
      if (payload.role || payload.status) {
        throw new ApiError(400, 'Self-modification of administrative role or status is forbidden.', 'SELF_MODIFICATION_FORBIDDEN');
      }
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new ApiError(404, 'User account not found.', 'NOT_FOUND');
    }

    // Apply updates
    if (payload.fullName !== undefined) user.fullName = payload.fullName;
    if (payload.email !== undefined) user.email = payload.email;
    if (payload.phone !== undefined) user.phone = payload.phone;
    if (payload.role !== undefined) user.role = payload.role;
    if (payload.status !== undefined) user.status = payload.status;

    await user.save();

    return {
      _id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Fetch a paginated list of sellers with their aggregated products count.
   */
  public async getSellers(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { search } = query;

    const match: any = { role: 'seller', status: { $ne: 'deleted' } };

    if (search) {
      match.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sellersPipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'seller',
          as: 'sellerProducts',
        },
      },
      {
        $project: {
          _id: 1,
          fullName: 1,
          email: 1,
          phone: 1,
          status: 1,
          createdAt: 1,
          productsCount: { $size: '$sellerProducts' },
        },
      },
      { $sort: { createdAt: -1 as const } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [sellers, total] = await Promise.all([
      User.aggregate(sellersPipeline),
      User.countDocuments(match),
    ]);

    return {
      sellers,
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  }

  /**
   * Fetch reviews with paginated search across comments, products, and reviewers.
   */
  public async getReviews(query: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { search } = query;

    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ] as any[];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { comment: { $regex: search, $options: 'i' } },
            { 'user.fullName': { $regex: search, $options: 'i' } },
            { 'product.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 as const } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          sellerReply: 1,
          status: 1,
          createdAt: 1,
          user: { _id: '$user._id', fullName: '$user.fullName', email: '$user.email' },
          product: { _id: '$product._id', name: '$product.name', slug: '$product.slug' },
        },
      }
    );

    const countPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
    ] as any[];

    if (search) {
      countPipeline.push({
        $match: {
          $or: [
            { comment: { $regex: search, $options: 'i' } },
            { 'user.fullName': { $regex: search, $options: 'i' } },
            { 'product.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }
    countPipeline.push({ $count: 'total' });

    const [reviews, countResult] = await Promise.all([
      Review.aggregate(pipeline),
      Review.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return {
      reviews,
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  }

  /**
   * Toggle or update review moderation status. Recalculates product rating.
   */
  public async updateReview(id: string, payload: { status: 'active' | 'hidden' }) {
    const review = await Review.findById(id);
    if (!review) {
      throw new ApiError(404, 'Review not found.', 'NOT_FOUND');
    }

    if (payload.status !== undefined) review.status = payload.status;
    await review.save();

    // Recalculate parent product's average rating excluding hidden reviews
    const parentProductId = review.productId.toString();
    const reviews = await Review.find({ productId: review.productId, status: { $ne: 'hidden' } });
    const ratings = reviews.map((r) => r.rating);
    await productService.recalculateRating(parentProductId, ratings);

    return review;
  }

  /**
   * Permanently delete a review from DB. Recalculates product rating.
   */
  public async deleteReview(id: string) {
    const review = await Review.findById(id);
    if (!review) {
      throw new ApiError(404, 'Review not found.', 'NOT_FOUND');
    }

    const parentProductId = review.productId.toString();
    await review.deleteOne();

    // Recalculate parent product's average rating excluding hidden reviews
    const reviews = await Review.find({ productId: review.productId, status: { $ne: 'hidden' } });
    const ratings = reviews.map((r) => r.rating);
    await productService.recalculateRating(parentProductId, ratings);
  }

  /**
   * Fetch promo codes with search and pagination.
   */
  public async getCoupons(query: { page?: number; limit?: number; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const { search } = query;

    const filter: any = {};
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }

    const [coupons, total] = await Promise.all([
      PromoCode.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PromoCode.countDocuments(filter),
    ]);

    return {
      coupons,
      total,
      pages: Math.ceil(total / limit),
      page,
    };
  }

  /**
   * Create a new promo code.
   */
  public async createCoupon(payload: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive?: boolean;
    usageLimit?: number;
    expirationDate?: string | Date;
  }) {
    const existing = await PromoCode.findOne({ code: payload.code.toUpperCase().trim() });
    if (existing) {
      throw new ApiError(400, 'Coupon code already exists.', 'DUPLICATE_COUPON');
    }

    const coupon = new PromoCode({
      ...payload,
      code: payload.code.toUpperCase().trim(),
    });
    await coupon.save();
    return coupon;
  }

  /**
   * Update an existing promo code.
   */
  public async updateCoupon(
    id: string,
    payload: {
      code?: string;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      isActive?: boolean;
      usageLimit?: number;
      expirationDate?: string | Date;
    }
  ) {
    const coupon = await PromoCode.findById(id);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found.', 'NOT_FOUND');
    }

    if (payload.code) {
      const codeStr = payload.code.toUpperCase().trim();
      if (codeStr !== coupon.code) {
        const existing = await PromoCode.findOne({ code: codeStr });
        if (existing) {
          throw new ApiError(400, 'Coupon code already exists.', 'DUPLICATE_COUPON');
        }
        coupon.code = codeStr;
      }
    }

    if (payload.discountType !== undefined) coupon.discountType = payload.discountType;
    if (payload.discountValue !== undefined) coupon.discountValue = payload.discountValue;
    if (payload.isActive !== undefined) coupon.isActive = payload.isActive;
    
    if (payload.usageLimit !== undefined) {
      coupon.usageLimit = payload.usageLimit === null ? undefined : payload.usageLimit;
    }

    if (payload.expirationDate !== undefined) {
      coupon.expirationDate = payload.expirationDate ? new Date(payload.expirationDate) : undefined;
    }

    await coupon.save();
    return coupon;
  }

  /**
   * Permanently delete a promo code.
   */
  public async deleteCoupon(id: string) {
    const coupon = await PromoCode.findById(id);
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found.', 'NOT_FOUND');
    }
    await coupon.deleteOne();
  }

  /**
   * Fetch all platform settings with fallback defaults.
   */
  public async getSettings() {
    const list = await Setting.find({});
    const map: Record<string, any> = {};
    for (const item of list) {
      map[item.key] = item.value;
    }
    return {
      taxRate: map.taxRate !== undefined ? map.taxRate : 10,
      freeShippingThreshold: map.freeShippingThreshold !== undefined ? map.freeShippingThreshold : 100,
      shippingCost: map.shippingCost !== undefined ? map.shippingCost : 10,
      contactEmail: map.contactEmail !== undefined ? map.contactEmail : 'support@curio.com',
      lowStockThreshold: map.lowStockThreshold !== undefined ? map.lowStockThreshold : 5,
    };
  }

  /**
   * Update settings fields in bulk.
   */
  public async updateSettings(payload: Record<string, any>) {
    const keys = ['taxRate', 'freeShippingThreshold', 'shippingCost', 'contactEmail', 'lowStockThreshold'];
    for (const key of keys) {
      if (payload[key] !== undefined) {
        let val = payload[key];
        if (key === 'taxRate' || key === 'freeShippingThreshold' || key === 'shippingCost') {
          val = Number(val);
          if (isNaN(val) || val < 0) continue;
        }
        if (key === 'lowStockThreshold') {
          val = Number(val);
          if (isNaN(val) || !Number.isInteger(val) || val < 1) {
            throw new ApiError(400, 'Low stock threshold must be a positive integer greater than or equal to 1.', 'VALIDATION_ERROR');
          }
        }
        await Setting.findOneAndUpdate(
          { key },
          { key, value: val },
          { upsert: true, new: true }
        );
      }
    }
    return this.getSettings();
  }

  /**
   * Helper to retrieve individual platform settings dynamically.
   */
  public async getSettingValue(key: string, defaultValue: any) {
    const doc = await Setting.findOne({ key });
    return doc ? doc.value : defaultValue;
  }
}

export const adminService = new AdminService();
