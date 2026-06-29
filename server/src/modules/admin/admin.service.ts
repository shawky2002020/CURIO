import { User } from '../users/user.model.js';
import { Product } from '../products/product.model.js';
import { Order } from '../cart/order.model.js';
import { Category } from '../products/category.model.js';
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
}

export const adminService = new AdminService();
