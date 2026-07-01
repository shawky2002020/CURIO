import { Product } from '../products/product.model.js';
import { Order } from '../cart/order.model.js';
import { Review } from '../products/review.model.js';
import { Setting } from '../admin/setting.model.js';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

class SellerService {
  /**
   * Fetch aggregate and timeline dashboard statistics for a given seller.
   */
  public async getDashboardData(sellerId: string) {
    // 1. Fetch seller products (exclude soft-deleted ones)
    const sellerProducts = await Product.find({ seller: sellerId, deletedAt: null });
    const sellerProductIds = sellerProducts.map((p) => p._id);

    // 2. Fetch orders containing seller's products
    const orders = await Order.find({ 'items.productId': { $in: sellerProductIds } });

    // Fetch dynamic low stock threshold setting
    const setting = await Setting.findOne({ key: 'lowStockThreshold' });
    const threshold = setting ? Number(setting.value) : 5;

    // Stats calculations
    const productsCount = sellerProducts.length;
    const lowStockCount = sellerProducts.filter((p) => p.stock > 0 && p.stock <= threshold).length;
    const ordersCount = orders.length;

    // Filter out cancelled orders for revenue calculation
    const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');

    let totalRevenue = 0;
    for (const order of nonCancelledOrders) {
      for (const item of order.items) {
        if (sellerProductIds.some((pid) => pid.toString() === item.productId.toString())) {
          totalRevenue += item.price * item.quantity;
        }
      }
    }
    totalRevenue = Math.round(totalRevenue * 100) / 100;

    // 3. Last 12 months sales and revenue chart datasets
    const monthlySales: { month: string; year: number; value: number }[] = [];
    const monthlyRevenue: { month: string; year: number; value: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthNum = d.getMonth();
      const yearNum = d.getFullYear();

      // Filter orders in this month
      const ordersInMonth = orders.filter((o) => {
        const oDate = new Date(o.createdAt);
        return oDate.getMonth() === monthNum && oDate.getFullYear() === yearNum;
      });

      let salesCount = 0;
      let revenueAmount = 0;

      for (const order of ordersInMonth) {
        const isCancelled = order.status === 'cancelled';
        for (const item of order.items) {
          if (sellerProductIds.some((pid) => pid.toString() === item.productId.toString())) {
            salesCount += item.quantity;
            if (!isCancelled) {
              revenueAmount += item.price * item.quantity;
            }
          }
        }
      }

      monthlySales.push({
        month: MONTH_NAMES[monthNum],
        year: yearNum,
        value: salesCount,
      });

      monthlyRevenue.push({
        month: MONTH_NAMES[monthNum],
        year: yearNum,
        value: Math.round(revenueAmount * 100) / 100,
      });
    }

    // 4. Fetch recent orders
    const recentOrdersList = orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((o) => {
        let sellerSubtotal = 0;
        for (const item of o.items) {
          if (sellerProductIds.some((pid) => pid.toString() === item.productId.toString())) {
            sellerSubtotal += item.price * item.quantity;
          }
        }
        return {
          _id: o._id,
          customerName: o.shippingAddress.fullName,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          sellerSubtotal: Math.round(sellerSubtotal * 100) / 100,
          createdAt: o.createdAt,
        };
      });

    // 5. Fetch recent reviews
    const recentReviewsList = await Review.find({
      productId: { $in: sellerProductIds },
      status: 'active',
    })
      .populate('productId', 'name')
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      stats: {
        revenue: totalRevenue,
        orders: ordersCount,
        products: productsCount,
        lowStock: lowStockCount,
      },
      charts: {
        monthlySales,
        monthlyRevenue,
      },
      recent: {
        orders: recentOrdersList,
        reviews: recentReviewsList,
      },
      settings: {
        lowStockThreshold: threshold,
      },
    };
  }
}

export const sellerService = new SellerService();
export default sellerService;
