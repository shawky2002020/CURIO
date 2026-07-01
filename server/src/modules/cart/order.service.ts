import { Types } from 'mongoose';
import Stripe from 'stripe';
import { ApiError } from '../../utils/ApiError.js';
import { Order, IOrder, IShippingAddress } from './order.model.js';
import { Product } from '../products/product.model.js';
import { cartService } from './cart.service.js';
import { PromoCode } from './promo.model.js';
import { env } from '../../config/env.js';
import { sendEmail } from '../../services/email.service.js';
import { getOrderConfirmationTemplate, getOrderStatusUpdateTemplate } from '../../utils/emailTemplates.js';

const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export class OrderService {
  /**
   * Processes cart checkout, creates a pending Order, and generates a Stripe session.
   */
  public async checkout(
    shippingAddress: IShippingAddress,
    userId?: string,
    guestId?: string,
    paymentMethod: 'card' | 'cash' = 'card'
  ): Promise<{ order: IOrder; checkoutUrl?: string }> {
    // 1. Retrieve current cart
    const cart = await cartService.getOrCreateCart(userId, guestId);
    if (cart.items.length === 0) {
      throw new ApiError(400, 'Cannot place order. Your shopping cart is empty.', 'EMPTY_CART');
    }

    // 2. Populate and compute totals (also validates applied promo codes)
    const { cart: populatedCart, totals } = await cartService.getPopulatedCartWithTotals(cart);

    // 3. Verify stock and build snapshot order items
    const orderItems: any[] = [];
    
    for (const item of populatedCart.items) {
      const product = await Product.findById(item.productId._id);
      if (!product) {
        throw new ApiError(
          404,
          `Product "${item.productId.name}" no longer exists in our registry.`,
          'PRODUCT_NOT_FOUND'
        );
      }

      if (product.status !== 'active') {
        throw new ApiError(
          400,
          `Product "${product.name}" is no longer available.`,
          'PRODUCT_UNAVAILABLE'
        );
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`,
          'INSUFFICIENT_STOCK'
        );
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images && product.images.length > 0 ? product.images[0] : undefined,
      });
    }

    // 4. Create Order document (initially pending)
    const orderData: any = {
      items: orderItems,
      shippingAddress,
      totals,
      status: paymentMethod === 'cash' ? 'confirmed' : 'pending',
      paymentStatus: 'pending',
      paymentMethod,
    };

    if (userId) {
      orderData.userId = new Types.ObjectId(userId);
    } else if (guestId) {
      orderData.guestId = guestId;
    }

    if (cart.promoCode) {
      orderData.promoCode = cart.promoCode;
    }

    const order = await Order.create(orderData);

    // 5. Decrement product stock immediately to reserve inventory during checkout session
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    if (paymentMethod === 'cash') {
      await cartService.clearCart(userId, guestId);
      if (order.promoCode) {
        await PromoCode.findOneAndUpdate({ code: order.promoCode }, { $inc: { usedCount: 1 } });
      }
      // Send confirmation email
      try {
        const emailHtml = getOrderConfirmationTemplate(order, env.CLIENT_URL);
        await sendEmail(order.shippingAddress.email, `CURIO // Order Confirmation #${order._id}`, emailHtml);
      } catch (emailErr) {
        console.error('[Email Error] Failed to send order confirmation email:', emailErr);
      }
      return { order };
    }

    // 6. Generate Stripe session if Stripe is configured and payment method is card
    if (stripe && paymentMethod === 'card') {
      try {
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderItems.map((item) => {
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
                images: item.image ? [item.image] : [],
              },
              unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
            },
            quantity: item.quantity,
          };
        });

        // Add shipping fee if applicable
        if (totals.shipping > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Shipping Fee',
                images: [],
              },
              unit_amount: Math.round(totals.shipping * 100),
            },
            quantity: 1,
          });
        }

        // Add tax if applicable
        if (totals.tax > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Tax (10%)',
                images: [],
              },
              unit_amount: Math.round(totals.tax * 100),
            },
            quantity: 1,
          });
        }

        // Add discount as a negative line item if applicable
        if (totals.discount > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Discount (${order.promoCode || 'PROMO'})`,
                images: [],
              },
              unit_amount: -Math.round(totals.discount * 100),
            },
            quantity: 1,
          });
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${env.CLIENT_URL}/orders/${order._id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.CLIENT_URL}/checkout?cancelled=true`,
          client_reference_id: order._id.toString(),
          customer_email: shippingAddress.email,
        });

        order.stripeSessionId = session.id;
        await order.save();

        return { order, checkoutUrl: session.url || undefined };
      } catch (err: any) {
        console.error('[Stripe Error] Failed to create checkout session:', err);
        // Fallback to sandbox if stripe fails or has invalid keys during local testing
      }
    }

    // Fallback: If Stripe is not configured or fails, clear cart immediately and mark as processing (sandbox)
    await cartService.clearCart(userId, guestId);
    order.paymentStatus = 'paid';
    order.status = 'processing';
    await order.save();

    if (order.promoCode) {
      await PromoCode.findOneAndUpdate({ code: order.promoCode }, { $inc: { usedCount: 1 } });
    }

    // Send confirmation email
    try {
      const emailHtml = getOrderConfirmationTemplate(order, env.CLIENT_URL);
      await sendEmail(order.shippingAddress.email, `CURIO // Order Confirmation #${order._id}`, emailHtml);
    } catch (emailErr) {
      console.error('[Email Error] Failed to send confirmation email:', emailErr);
    }

    return { order };
  }

  /**
   * Verifies the Stripe session status and transitions order status to paid / processing.
   */
  public async verifyPayment(
    orderId: string,
    sessionId: string,
    userId?: string,
    guestId?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    // If order is already paid, just return it
    if (order.paymentStatus === 'paid') {
      return order;
    }

    let paymentSuccess = false;

    if (stripe && sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          paymentSuccess = true;
          order.stripeSessionId = sessionId;
        }
      } catch (err) {
        console.error('[Stripe Error] Verification failed:', err);
        throw new ApiError(400, 'Failed to verify payment session with Stripe.', 'PAYMENT_VERIFICATION_FAILED');
      }
    } else {
      // In sandbox mode without Stripe configured, treat any verify attempt as successful
      paymentSuccess = true;
    }

    if (paymentSuccess) {
      order.paymentStatus = 'paid';
      order.status = 'processing';
      await order.save();

      // Clear checkout owner's cart now that order is finalized
      await cartService.clearCart(userId, guestId);

      if (order.promoCode) {
        await PromoCode.findOneAndUpdate({ code: order.promoCode }, { $inc: { usedCount: 1 } });
      }

      // Send confirmation email
      try {
        const emailHtml = getOrderConfirmationTemplate(order, env.CLIENT_URL);
        await sendEmail(order.shippingAddress.email, `CURIO // Order Confirmation #${order._id}`, emailHtml);
      } catch (emailErr) {
        console.error('[Email Error] Failed to send confirmation email:', emailErr);
      }
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      throw new ApiError(400, 'Order payment has not been completed.', 'PAYMENT_FAILED');
    }

    return order;
  }

  public async getOrdersForRole(
    userId: string,
    role: string,
    page?: number,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<any> {
    const query: Record<string, any> = {};

    if (role === 'seller') {
      const sellerProductIds = await Product.find({ seller: new Types.ObjectId(userId) }).distinct('_id');
      query['items.productId'] = { $in: sellerProductIds };
    } else if (role !== 'admin') {
      query.userId = new Types.ObjectId(userId);
    }

    // Apply filters before pagination/statistics
    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const orConditions: any[] = [
        { 'shippingAddress.fullName': searchRegex },
        { 'shippingAddress.email': searchRegex }
      ];
      if (Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: new Types.ObjectId(search) });
      }
      query.$or = orConditions;
    }

    // 1. Calculate statistics matching the core role query (exclude page status & search filter to keep counts global for dashboard)
    const statsQuery = { ...query };
    delete statsQuery.status;
    delete statsQuery.$or;

    const statusCounts = await Order.aggregate([
      { $match: statsQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const stats = {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    statusCounts.forEach((sc) => {
      if (sc._id === 'pending') stats.pending = sc.count;
      else if (sc._id === 'confirmed') stats.confirmed = sc.count;
      else if (sc._id === 'processing') stats.processing = sc.count;
      else if (sc._id === 'shipped') stats.shipped = sc.count;
      else if (sc._id === 'delivered') stats.delivered = sc.count;
      else if (sc._id === 'cancelled') stats.cancelled = sc.count;
    });
    stats.total = stats.pending + stats.confirmed + stats.processing + stats.shipped + stats.delivered + stats.cancelled;

    // 2. Perform query
    let ordersQuery = Order.find(query)
      .populate('userId', 'fullName email')
      .populate({
        path: 'items.productId',
        select: 'name seller',
        populate: {
          path: 'seller',
          select: 'fullName storeName storeLogoUrl'
        }
      })
      .sort({ createdAt: -1 });

    if (page !== undefined) {
      const skip = (page - 1) * limit;
      ordersQuery = ordersQuery.skip(skip).limit(limit);
    }

    const orders = await ordersQuery;

    if (page !== undefined) {
      const total = await Order.countDocuments(query);
      const pages = Math.ceil(total / limit);
      return {
        orders,
        total,
        pages,
        page,
        limit,
        stats
      };
    }

    return orders;
  }

  /**
   * Updates status of an order and dispatches update notification email.
   */
  public async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    requestingUser: { _id: string; role: string }
  ): Promise<IOrder> {
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'seller') {
      throw new ApiError(403, 'Forbidden. Only admins and sellers can update order status.', 'FORBIDDEN');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    // 1. Resolve unique seller IDs for all products in this order
    const productIds = order.items.map((item) => item.productId);
    const productsInOrder = await Product.find({ _id: { $in: productIds } });
    const sellerIds = new Set(productsInOrder.map((p) => p.seller.toString()));
    const isMultiSeller = sellerIds.size > 1;

    // 2. Perform Seller-specific validations and operations
    if (requestingUser.role === 'seller') {
      // Check if seller owns any products in this order
      const sellerProductIds = await Product.find({
        seller: new Types.ObjectId(requestingUser._id),
      }).distinct('_id');
      const sellerProductStrIds = sellerProductIds.map((id) => id.toString());

      const ownsProduct = order.items.some((item) =>
        sellerProductStrIds.includes(item.productId.toString())
      );

      if (!ownsProduct) {
        throw new ApiError(403, 'Forbidden. You do not own any products in this order.', 'FORBIDDEN');
      }

      // If it's a multi-seller order:
      if (isMultiSeller) {
        // Sellers cannot advance status (confirmed, processing, shipped, delivered) on multi-seller orders
        if (status !== 'cancelled') {
          throw new ApiError(
            403,
            'Forbidden. This order contains products from multiple sellers and its status can only be advanced by an administrator.',
            'FORBIDDEN'
          );
        }

        // If the seller is cancelling: remove ONLY their items and recalculate totals
        if (status === 'cancelled') {
          const sellerItems = order.items.filter((item) =>
            sellerProductStrIds.includes(item.productId.toString())
          );
          const otherItems = order.items.filter(
            (item) => !sellerProductStrIds.includes(item.productId.toString())
          );

          if (otherItems.length > 0) {
            // Replenish stock for the seller's items only
            for (const item of sellerItems) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity },
              });
            }

            // Remove the items from the order
            order.items = otherItems;

            // Recalculate totals
            const newSubtotal = otherItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            order.totals.subtotal = newSubtotal;
            order.totals.tax = Math.round(newSubtotal * 0.1 * 100) / 100;
            order.totals.total = Math.max(
              0,
              newSubtotal + order.totals.shipping + order.totals.tax - order.totals.discount
            );

            await order.save();

            // Trigger notification email to customer
            try {
              const emailHtml = `
                <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                  <h2>Order Update</h2>
                  <p>Dear Customer,</p>
                  <p>Some items in your Order #${order._id.toString().substring(18).toUpperCase()} were cancelled by the studio partner.</p>
                  <p>The remaining items are still active and being processed. Your new order total is <strong>$${order.totals.total.toFixed(2)}</strong>.</p>
                  <p>Thank you for choosing CURIO.</p>
                </div>
              `;
              await sendEmail(order.shippingAddress.email, `CURIO // Order Update #${order._id}`, emailHtml);
            } catch (emailErr) {
              console.error('[Email Error] Failed to send cancel portion notification:', emailErr);
            }

            return order;
          }
        }
      }
    }

    // 3. Normal / Admin / Single-Seller Flow
    if (order.status === status) {
      return order;
    }

    const previousStatus = order.status;
    order.status = status;

    // Automatically set paymentStatus to paid when COD order is marked as delivered
    if (status === 'delivered' && order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid';
    }

    // Handle inventory replenishment on global cancellation
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await order.save();

    // Trigger status update email
    try {
      const emailHtml = getOrderStatusUpdateTemplate(order, env.CLIENT_URL);
      await sendEmail(order.shippingAddress.email, `CURIO // Order status advanced to: ${status}`, emailHtml);
    } catch (emailErr) {
      console.error('[Email Error] Failed to send status update email:', emailErr);
    }

    return order;
  }

  /**
   * Retrieves order by ID with secure authorization checks.
   */
  public async getOrderById(
    orderId: string,
    requestingUser?: { _id: string; role: string },
    requestingGuestId?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId)
      .populate('userId', 'fullName email')
      .populate({
        path: 'items.productId',
        populate: {
          path: 'seller',
          select: 'fullName email storeName storeLogoUrl'
        }
      });
    if (!order) {
      throw new ApiError(404, 'Order not found.', 'ORDER_NOT_FOUND');
    }

    // Bypass check for admins or sellers
    if (requestingUser && (requestingUser.role === 'admin' || requestingUser.role === 'seller')) {
      return order;
    }

    // Check ownership
    if (order.userId) {
      const orderUserId = (order.userId as any)._id
        ? (order.userId as any)._id.toString()
        : order.userId.toString();
      if (!requestingUser || orderUserId !== requestingUser._id.toString()) {
        throw new ApiError(403, 'Access denied. You do not own this order.', 'ACCESS_DENIED');
      }
    } else if (order.guestId) {
      if (!requestingGuestId || order.guestId !== requestingGuestId) {
        throw new ApiError(403, 'Access denied. Guest identifier does not match this order.', 'ACCESS_DENIED');
      }
    } else {
      throw new ApiError(403, 'Access denied. Order cannot be verified.', 'ACCESS_DENIED');
    }

    return order;
  }
}

export const orderService = new OrderService();
export default orderService;

